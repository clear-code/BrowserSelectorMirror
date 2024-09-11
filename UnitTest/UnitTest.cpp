#include "pch.h"
#include "CppUnitTest.h"
#include "../BrowserSelector/BrowserSelectorCommon.h"

#define TO_WIDE(str) L##str
#define MACRO_TO_WIDE(macro) TO_WIDE(macro)

using namespace std;
using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace UnitTest
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

	TEST_CLASS(Config)
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
	};
}