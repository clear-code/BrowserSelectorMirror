#include "pch.h"
#include "CppUnitTest.h"
#include "../BrowserSelector/BrowserSelectorCommon.h"
#include "fstream"

#define TO_WIDE(str) L##str
#define MACRO_TO_WIDE(macro) TO_WIDE(macro)

using namespace std;
using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace TestMatching
{
	TEST_CLASS(MatchSimpleWildCard)
	{
	public:

		TEST_METHOD(WildCard)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"https://www.example.com");
			wstring pattern(L"https://*.example.com");
			Assert::IsTrue(app.matchSimpleWildCard(url, pattern));
		}

		TEST_METHOD(UnmatchedHost)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"https://www2.example.com");
			wstring pattern(L"https://www.example.com");
			Assert::IsFalse(app.matchSimpleWildCard(url, pattern));
		}

		TEST_METHOD(CaseInsensitiveScheme)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"HTTPS://www.example.com");
			wstring pattern(L"https://*.example.com");
			Assert::IsTrue(app.matchSimpleWildCard(url, pattern));
		}

		TEST_METHOD(CaseInsensitiveHostName)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"https://WWW.example.com");
			wstring pattern(L"https://www.example.com");
			Assert::IsTrue(app.matchSimpleWildCard(url, pattern));
		}

		TEST_METHOD(CaseInsensitiveDomain)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"https://www.EXAMPLE.COM");
			wstring pattern(L"https://www.example.com");
			Assert::IsTrue(app.matchSimpleWildCard(url, pattern));
		}

		TEST_METHOD(CaseInsensitivePath)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"https://www.example.com/Path/To/RESOURCE");
			wstring pattern(L"https://www.example.com/path/to/resource");
			Assert::IsTrue(app.matchSimpleWildCard(url, pattern));
		}
		TEST_METHOD(UNCPath)
		{
			DefaultConfig config;
			BrowserSelector app(config);
			wstring url(L"\\\\shared\\folder");
			wstring pattern(L"\\\\\\\\shared\\\\folder");
			Assert::IsTrue(app.matchSimpleWildCard(url, pattern));
		}
	};
}

namespace TestConfig
{
	TEST_CLASS(TestBaseConfig)
	{
	public:
		TEST_METHOD(DumpAsJson)
		{
			DefaultConfig config;
			std::wstring buf;
			config.dumpAsJson(buf);
			Assert::AreEqual(
				L"{\"DefaultBrowser\":\"ie\",\"SecondBrowser\":\"\",\"FirefoxCommand\":\"\",\"CloseEmptyTab\":1,\"OnlyOnAnchorClick\":0,\"UseRegex\":0,\"URLPatterns\":[],\"HostNamePatterns\":[],\"ZonePatterns\":[]}",
				buf.c_str());
		}
		TEST_METHOD(DontMergeDebug)
		{
			Config config1, config2;
			config1.m_debug = 1;
			Assert::AreEqual(-1, config2.m_debug);
			std::vector<Config*> configs({ &config2 });
			config1.merge(configs);
			Assert::AreEqual(1, config1.m_debug);
		}
		TEST_METHOD(MergeDebug)
		{
			Config config1, config2;
			config1.m_debug = 1;
			config2.m_debug = 0;
			std::vector<Config*> configs({&config2});
			config1.merge(configs);
			Assert::AreEqual(0, config1.m_debug);
		}
		TEST_METHOD(DontMergeCloseEmptyTab)
		{
			Config config1, config2;
			config1.m_closeEmptyTab = 1;
			Assert::AreEqual(-1, config2.m_closeEmptyTab);
			std::vector<Config*> configs({ &config2 });
			config1.merge(configs);
			Assert::AreEqual(1, config1.m_closeEmptyTab);
		}
		TEST_METHOD(MergeCloseEmptyTab)
		{
			Config config1, config2;
			config1.m_closeEmptyTab = 1;
			config2.m_closeEmptyTab = 0;
			std::vector<Config*> configs({ &config2 });
			config1.merge(configs);
			Assert::AreEqual(0, config1.m_closeEmptyTab);
		}
		TEST_METHOD(MergeUrlPatterms)
		{
			Config config1, config2, config3;
			config1.m_urlPatterns = { {L"https://mozilla.org/*", L"firefox"} };
			config2.m_urlPatterns = { {L"https://google.com/*", L"chrome"} };
			config3.m_urlPatterns = { {L"https://microsoft.com/*", L"edge"} };
			std::vector<Config*> configs({ &config2, &config3 });
			config1.merge(configs);
			Assert::AreEqual(L"https://microsoft.com/*", config1.m_urlPatterns[0].first.c_str());
			Assert::AreEqual(L"edge", config1.m_urlPatterns[0].second.c_str());
			Assert::AreEqual(L"https://google.com/*", config1.m_urlPatterns[1].first.c_str());
			Assert::AreEqual(L"chrome", config1.m_urlPatterns[1].second.c_str());
			Assert::AreEqual(L"https://mozilla.org/*", config1.m_urlPatterns[2].first.c_str());
			Assert::AreEqual(L"firefox", config1.m_urlPatterns[2].second.c_str());
		}
		TEST_METHOD(MergeHostNamePatterms)
		{
			Config config1, config2, config3;
			config1.m_urlPatterns = { {L"*.mozilla.org", L"firefox"} };
			config2.m_urlPatterns = { {L"*.google.com", L"chrome"} };
			config3.m_urlPatterns = { {L"*.microsoft.com", L"edge"} };
			std::vector<Config*> configs({ &config2, &config3 });
			config1.merge(configs);
			Assert::AreEqual(L"*.microsoft.com", config1.m_urlPatterns[0].first.c_str());
			Assert::AreEqual(L"edge", config1.m_urlPatterns[0].second.c_str());
			Assert::AreEqual(L"*.google.com", config1.m_urlPatterns[1].first.c_str());
			Assert::AreEqual(L"chrome", config1.m_urlPatterns[1].second.c_str());
			Assert::AreEqual(L"*.mozilla.org", config1.m_urlPatterns[2].first.c_str());
			Assert::AreEqual(L"firefox", config1.m_urlPatterns[2].second.c_str());
		}
	};

	TEST_CLASS(TestDefaultConfig)
	{
	public:
		DefaultConfig config;
		TEST_METHOD(DefaultDebug)
		{
			Assert::AreEqual(0, config.m_debug);
		}
		TEST_METHOD(DefaultChromeDebug)
		{
			Assert::AreEqual(0, config.m_chromeDebug);
		}
		TEST_METHOD(DefaultChromeDebugVerbose)
		{
			Assert::AreEqual(0, config.m_chromeDebugVerbose);
		}
		TEST_METHOD(DefaultEdgeDebug)
		{
			Assert::AreEqual(0, config.m_edgeDebug);
		}
		TEST_METHOD(DefaultEdgeDebugVerbose)
		{
			Assert::AreEqual(0, config.m_edgeDebugVerbose);
		}
		TEST_METHOD(DefaultEdgeDefaultBrowser)
		{
			Assert::AreEqual(L"ie", config.m_defaultBrowser.c_str());
		}
		TEST_METHOD(DefaultEdgeSecondBrowser)
		{
			Assert::IsTrue(config.m_secondBrowser.empty());
		}
		TEST_METHOD(DefaultFirefoxCommand)
		{
			Assert::IsTrue(config.m_firefoxCommand.empty());
		}
		TEST_METHOD(DefaultCloseEmptyTab)
		{
			Assert::AreEqual(1, config.m_closeEmptyTab);
		}
		TEST_METHOD(DefaultOnlyOnAnchorClick)
		{
			Assert::AreEqual(0, config.m_onlyOnAnchorClick);
		}
		TEST_METHOD(DefaultUseRegex)
		{
			Assert::AreEqual(0, config.m_useRegex);
		}
		TEST_METHOD(DefaultUrlPatterns)
		{
			Assert::IsTrue(config.m_urlPatterns.empty());
		}
		TEST_METHOD(DefaultHostNamePatterns)
		{
			Assert::IsTrue(config.m_hostNamePatterns.empty());
		}
		TEST_METHOD(DefaultZonePatterns)
		{
			Assert::IsTrue(config.m_zonePatterns.empty());
		}
	};

	TEST_CLASS(TestINIFileConfig)
	{
	public:
		TEST_METHOD(CopyToTempFile_tmpPath)
		{
			std::wstring srcPath(MACRO_TO_WIDE(__FILE__));
			std::wstring tmpPath1, tmpPath2;
			std::wstring cachePath(INIFileConfig::GetCacheFolderPath());
			Assert::IsTrue(INIFileConfig::CopyToTempFile(srcPath, tmpPath1));
			Assert::IsTrue(INIFileConfig::CopyToTempFile(srcPath, tmpPath2));
			DeleteFileW(tmpPath1.c_str());
			DeleteFileW(tmpPath2.c_str());
			Assert::AreEqual(cachePath, tmpPath1.substr(0, cachePath.size()));
			Assert::AreEqual(cachePath, tmpPath2.substr(0, cachePath.size()));
			Assert::AreNotEqual(tmpPath1, tmpPath2);
			std::wstring tmpFilename1 = tmpPath1.substr(cachePath.size() + 1, -1);
			std::wstring tmpFilename2 = tmpPath2.substr(cachePath.size() + 1, -1);
			std::wstring pattern(L"^___[a-zA-Z0-9]+.tmp$");
			std::wsmatch wmatch;
			Assert::IsTrue(std::regex_search(tmpFilename1, wmatch, std::wregex(pattern)),
				(std::wstring(L"\"") + tmpFilename1 + L"\" does not match with \"" + pattern + L"\"").c_str());
			Assert::IsTrue(std::regex_search(tmpFilename2, wmatch, std::wregex(pattern)),
				(std::wstring(L"\"") + tmpFilename2 + L"\" does not match with \"" + pattern + L"\"").c_str());
		}
		const std::wstring GetExampleConfigPathW()
		{
			std::wstring path(MACRO_TO_WIDE(__FILE__));
			path.resize(path.rfind('\\') + 1);
			path += L"..\\sample\\BrowserSelectorExample.ini";
			return path;
		}
		const std::string GetExampleConfigPathA()
		{
			std::string path((__FILE__));
			path.resize(path.rfind('\\') + 1);
			path += "..\\sample\\BrowserSelectorExample.ini";
			return path;
		}
		void AssertExampleConfig(Config& config)
		{
			Assert::AreEqual(L"firefox", config.m_defaultBrowser.c_str());
			Assert::AreEqual(1, config.m_closeEmptyTab);
			Assert::AreEqual(L"http*://example.com", config.m_urlPatterns[0].first.c_str());
			Assert::AreEqual(L"ie", config.m_urlPatterns[0].second.c_str());
			Assert::AreEqual(L"http*://example.com/*", config.m_urlPatterns[1].first.c_str());
			Assert::AreEqual(L"ie", config.m_urlPatterns[1].second.c_str());
			Assert::AreEqual(L"http*://*.example.com", config.m_urlPatterns[2].first.c_str());
			Assert::AreEqual(L"ie", config.m_urlPatterns[2].second.c_str());
			Assert::AreEqual(L"http*://*.example.com/*", config.m_urlPatterns[3].first.c_str());
			Assert::AreEqual(L"ie", config.m_urlPatterns[3].second.c_str());
			Assert::AreEqual(L"example.org", config.m_hostNamePatterns[0].first.c_str());
			Assert::AreEqual(L"ie", config.m_urlPatterns[0].second.c_str());
			Assert::AreEqual(L"*.example.org", config.m_hostNamePatterns[1].first.c_str());
			Assert::AreEqual(L"ie", config.m_urlPatterns[0].second.c_str());
			Assert::AreEqual(L"local", config.m_zonePatterns[0].first.c_str());
			Assert::AreEqual(L"ie", config.m_zonePatterns[1].second.c_str());
			Assert::AreEqual(L"trusted", config.m_zonePatterns[1].first.c_str());
			Assert::AreEqual(L"ie", config.m_zonePatterns[1].second.c_str());
		}
		TEST_METHOD(load)
		{
			AssertExampleConfig(INIFileConfig(GetExampleConfigPathW()));
		}
		TEST_METHOD(Include)
		{
			std:wstring parentIniPath(L".\\tmp.ini");
			std::ofstream file;
			file.open(parentIniPath, std::ios::out);
			file << "[common]\r\n" << "Include=" << GetExampleConfigPathA().c_str();
			file.close();
			INIFileConfig config(parentIniPath);
			DeleteFileW(parentIniPath.c_str());
			AssertExampleConfig(config);
		}
	};
}