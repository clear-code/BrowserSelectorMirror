terraform {
  required_version = ">= 1.1.3"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>2.10"
    }

    local = {
      source  = "hashicorp/local"
      version = "~>1.4"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "local" {
}

resource "azurerm_resource_group" "bsverify" {
  name     = "BsverifyResourceGroup-${var.namespace}"
  location = "Japan East"
}

resource "azurerm_virtual_network" "bsverify" {
  name                = "bsverify-${var.namespace}-network"
  resource_group_name = azurerm_resource_group.bsverify.name
  location            = azurerm_resource_group.bsverify.location
  address_space       = ["10.5.0.0/16"]
}

resource "azurerm_subnet" "internal" {
  name                 = "internal"
  resource_group_name  = azurerm_resource_group.bsverify.name
  virtual_network_name = azurerm_virtual_network.bsverify.name
  address_prefixes     = ["10.5.2.0/24"]
}

resource "azurerm_network_interface" "bsverify" {
  name                = "bsverify-${var.namespace}-instance-nic"
  location            = azurerm_resource_group.bsverify.location
  resource_group_name = azurerm_resource_group.bsverify.name

  ip_configuration {
    name                          = "bsverify-${var.namespace}-instance-nic"
    subnet_id                     = azurerm_subnet.internal.id
    private_ip_address_allocation = "Static"
    private_ip_address            = "10.5.2.10"
    public_ip_address_id          = azurerm_public_ip.bsverify.id
  }
}

resource "azurerm_virtual_machine" "bsverify_vm" {
  name                             = "bsverify-${var.namespace}-vm"
  location                         = azurerm_resource_group.bsverify.location
  resource_group_name              = azurerm_resource_group.bsverify.name
  network_interface_ids            = [azurerm_network_interface.bsverify.id]
  vm_size                          = "Standard_B2S"
  delete_os_disk_on_termination    = true
  delete_data_disks_on_termination = true

  storage_image_reference {
    # Windows 10 Enterprise 21H2
    publisher = "MicrosoftWindowsDesktop"
    offer     = "Windows-10"
    sku       = "win10-21h2-ent"
    version   = "latest"

    ## Windows 10 Professional 2004
    #publisher = "MicrosoftWindowsDesktop"
    #offer     = "Windows-10"
    #sku       = "20h1-pro"
    #version   = "latest"

    ## Windows 10 Professional 1909
    #publisher = "MicrosoftWindowsDesktop"
    #offer     = "Windows-10"
    #sku       = "19h2-pro"
    #version   = "latest"

    ## Windows 10 Professional 1903
    #publisher = "MicrosoftWindowsDesktop"
    #offer     = "Windows-10"
    #sku       = "19h1-pro"
    #version   = "latest"

    ## Windows 10 Enterprise 1903
    #publisher = "MicrosoftWindowsDesktop"
    #offer     = "Windows-10"
    #sku       = "19h1-ent"
    #version   = "latest"

    ## Windows 10 Professional 1809
    #publisher = "MicrosoftWindowsDesktop"
    #offer     = "Windows-10"
    #sku       = "rs5-pro"
    #version   = "latest"

    ## Windows 7
    #publisher = "MicrosoftWindowsDesktop"
    #offer     = "windows-7"
    #sku       = "win7-enterprise"
    #version   = "latest"
  }

  storage_os_disk {
    name              = "bsverify-${var.namespace}-disk1"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "StandardSSD_LRS"
    os_type           = "Windows"
  }

  os_profile {
    computer_name  = "bsverify"
    admin_username = var.windows-username
    admin_password = var.windows-password
    custom_data    = file("./config/settings.ps1")
  }

  os_profile_windows_config {
    enable_automatic_upgrades = true
    provision_vm_agent        = true
    winrm {
      protocol = "http"
    }
    # Auto-Login's required to configure WinRM
    additional_unattend_config {
      pass         = "oobeSystem"
      component    = "Microsoft-Windows-Shell-Setup"
      setting_name = "AutoLogon"
      content      = "<AutoLogon><Password><Value>${var.windows-password}</Value></Password><Enabled>true</Enabled><LogonCount>1</LogonCount><Username>${var.windows-username}</Username></AutoLogon>"
    }
    # Unattend config is to enable basic auth in WinRM, required for the provisioner stage.
    additional_unattend_config {
      pass         = "oobeSystem"
      component    = "Microsoft-Windows-Shell-Setup"
      setting_name = "FirstLogonCommands"
      content      = file("./config/FirstLogonCommands.xml")
    }
  }

  tags = {
    CreatedBy = "clearcode"
    Purpose   = "Describe Terraform instruction"
  }

  connection {
    host     = azurerm_public_ip.bsverify.ip_address
    type     = "winrm"
    port     = 5985
    https    = false
    timeout  = "2m"
    user     = var.windows-username
    password = var.windows-password
  }

#  provisioner "local-exec" {
#    command = "bash -c ansible-playbook -i ansible/hosts ansible/playbook.yml"
#  }
}

resource "azurerm_dev_test_global_vm_shutdown_schedule" "bsverify" {
  virtual_machine_id    = azurerm_virtual_machine.bsverify_vm.id
  location              = azurerm_resource_group.bsverify.location
  enabled               = true
  daily_recurrence_time = "2200"
  timezone              = "Tokyo Standard Time"
  notification_settings {
    enabled = false
  }
}

resource "azurerm_network_security_group" "bsverify" {
  name                = "BsverifySecurityGroup-${var.namespace}"
  location            = "Japan East"
  resource_group_name = azurerm_resource_group.bsverify.name

  security_rule {
    name                       = "RDP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "WinRM"
    priority                   = 998
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5986"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "WinRM-out"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "5985"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    environment = "Creating with Terraform"
  }
}

resource "azurerm_network_interface_security_group_association" "bsverify" {
  network_interface_id      = azurerm_network_interface.bsverify.id
  network_security_group_id = azurerm_network_security_group.bsverify.id
}

resource "azurerm_public_ip" "bsverify" {
  name                    = "bsverify-${var.namespace}-collector-pip"
  location                = azurerm_resource_group.bsverify.location
  resource_group_name     = azurerm_resource_group.bsverify.name
  allocation_method       = "Dynamic"
  idle_timeout_in_minutes = 30

  tags = {
    environment = "bsverify-${var.namespace}-pip"
  }
}

data "azurerm_public_ip" "bsverify" {
  name                = azurerm_public_ip.bsverify.name
  resource_group_name = azurerm_virtual_machine.bsverify_vm.resource_group_name
}

output "vm_public_ip_address" {
  value = data.azurerm_public_ip.bsverify.ip_address
}

resource "local_file" "inventory" {
  filename = "ansible/hosts"
  content  = <<EOL
[windows]
${data.azurerm_public_ip.bsverify.ip_address}

[windows:vars]
ansible_user=${var.windows-username}
ansible_password=${var.windows-password}
ansible_port=5986
ansible_connection=winrm
ansible_winrm_server_cert_validation=ignore
EOL
}

resource "local_file" "playbook" {
  filename = "ansible/playbook.yml"
  content  = <<EOL
- hosts: windows
  become_method: runas
  vars:
    ansible_become_password: "${var.windows-password}"
  tasks:
    - name: Allow copy and paste to the UAC dialog
      win_regedit:
        key: HKLM:\Software\Microsoft\Windows\CurrentVersion\Policies\System
        value: PromptOnSecureDesktop
        data: 00000000
        datatype: dword
    - name: Set non-ASCII workgroup name
      win_domain_membership:
        domain_admin_user: "${var.windows-username}"
        domain_admin_password: "${var.windows-password}"
        state: workgroup
        workgroup_name: ワークグループ
    - name: Prepare directory to download language pack
      win_file:
        path: C:\temp
        state: directory
    - name: Download language pack file
      when: not "${var.windows-language-pack-url}" == ""
      win_get_url:
        url: "${var.windows-language-pack-url}"
        dest: 'c:\temp\lp.cab'
    - name: Install language pack
      when: not "${var.windows-language-pack-url}" == ""
      win_shell: |
        $LpTemp = "c:\temp\lp.cab"
        Add-WindowsPackage -PackagePath $LpTemp -Online
        Set-WinUserLanguageList -LanguageList ja-JP,en-US -Force
        Set-WinDefaultInputMethodOverride -InputTip "0411:00000411"
        Set-WinLanguageBarOption -UseLegacySwitchMode -UseLegacyLanguageBar
        Remove-Item $LpTemp -Force
    - win_reboot:
      when: not "${var.windows-language-pack-url}" == ""
    - win_timezone:
        timezone: Tokyo Standard Time
    - name: Set location
      win_shell: Set-WinHomeLocation -GeoId 0x7A
    - name: Set UI language
      win_shell: Set-WinUILanguageOverride -Language ja-JP
    - name: Set system language
      win_shell: Set-WinSystemLocale -SystemLocale ja-JP
    - name: Set date/time format
      win_shell: Set-WinCultureFromLanguageListOptOut -OptOut $False
    - name: Set keyboard layout
      win_shell: Set-ItemProperty 'registry::HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\i8042prt\Parameters' -Name 'LayerDriver JPN' -Value 'kbd106.dll'
    - win_reboot:
    - name: Set region globally
      win_region:
        copy_settings: yes
        location: "122"
        format: ja-JP
        unicode_language: ja-JP
    - win_reboot:
    - name: Create administrator user
      win_user:
        name: "管理者"
        password: "${var.windows-password}"
        password_never_expires: true
        state: present
        groups:
          - Administrators
          - Users
          - Remote Desktop Users
    - name: Set display language for the administrator user
      become: yes
      become_user: "管理者"
      win_shell: |
        Set-WinUILanguageOverride -Language ja-JP
        Set-WinDefaultInputMethodOverride -InputTip "0411:00000411"
    - name: Show hidden files for the administrator user
      become: yes
      become_user: "管理者"
      win_command: reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v Hidden /t REG_DWORD /d 1 /f
    - name: Show file extensions for the administrator user
      become: yes
      become_user: "管理者"
      win_command: reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v HideFileExt /t REG_DWORD /d 0 /f
    - name: Create regular user
      win_user:
        name: "ユーザー"
        password: "${var.windows-password}"
        password_never_expires: true
        state: present
        groups:
          - Users
          - Remote Desktop Users
    - name: Set display language for the regular user
      become: yes
      become_user: "ユーザー"
      win_shell: |
        Set-WinUILanguageOverride -Language ja-JP
        Set-WinDefaultInputMethodOverride -InputTip "0411:00000411"
    - name: Show hidden files for the regular user
      become: yes
      become_user: "ユーザー"
      win_command: reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v Hidden /t REG_DWORD /d 1 /f
    - name: Show file extensions for the regular user
      become: yes
      become_user: "ユーザー"
      win_command: reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v HideFileExt /t REG_DWORD /d 0 /f
    - name: Setup chocolatey
      win_chocolatey:
        name: chocolatey
        state: present
    - name: Install EmEditor
      win_chocolatey:
        name: emeditor
        state: present
        allow_empty_checksums: yes
        ignore_checksums: yes
    - name: Install Vim
      win_chocolatey:
        name: vim
        state: present
        allow_empty_checksums: yes
        ignore_checksums: yes
    - name: Download HookDate to override system time for Firefox
      when: not "${var.hookdate-download-url}" == ""
      win_get_url:
        url: "${var.hookdate-download-url}"
        dest: 'C:\Users\Public\hookdate.zip'
    - name: Extract contents
      when: not "${var.hookdate-download-url}" == ""
      win_unzip:
        src: 'C:\Users\Public\hookdate.zip'
        dest: 'c:\Users\Public'
        delete_archive: yes
    - name: Download DebugView for BrowserSelector
      when: not "${var.debugview-download-url}" == ""
      win_get_url:
        url: "${var.debugview-download-url}"
        dest: 'C:\Users\Public\DebugView.zip'
    - name: Extract contents
      when: not "${var.old-ie-download-url}" == ""
      win_unzip:
        src: 'C:\Users\Public\DebugView.zip'
        dest: 'c:\Users\Public'
        delete_archive: yes
    - name: Create shortcut to Program Files
      win_shortcut:
        src: '%ProgramFiles%'
        dest: '%Public%\Desktop\Program Files.lnk'
    - name: Create shortcut to Program Files (x86)
      win_shortcut:
        src: '%ProgramFiles(x86)%'
        dest: '%Public%\Desktop\Program Files (x86).lnk'
    - name: Download BrowserSelector for webextension
      win_get_url:
        url: "https://gitlab.com/clear-code/browserselector/-/archive/master/browserselector-master.zip"
        dest: 'c:\Users\Public\browserselector-master.zip'
    - name: Extract contents
      win_unzip:
        src: 'c:\Users\Public\browserselector-master.zip'
        dest: 'c:\Users\Public'
        delete_archive: yes
    - name: Extract only webextension
      win_copy:
        src: 'c:\Users\Public\browserselector-master\webextension'
        dest: 'c:\Users\Public'
        remote_src: True
    - name: Create shortcut to webextension
      win_shortcut:
        src: '%Public%\webextension'
        dest: '%Public%\Desktop\webextension.lnk'
    - name: Create shortcut to AppData
      win_shortcut:
        src: '%AppData%'
        dest: '%Public%\Desktop\AppData.lnk'
    - name: Create shortcut to LocalAppData
      win_shortcut:
        src: '%LocalAppData%'
        dest: '%Public%\Desktop\LocalAppData.lnk'
    - name: Copy batch to join dummy domain
      copy:
        src: join-dummy-domain.bat
        dest: 'c:\Users\Public\join-dummy-domain.bat'
    - name: Copy batch to leave dummy domain
      copy:
        src: leave-dummy-domain.bat
        dest: 'c:\Users\Public\leave-dummy-domain.bat'
EOL
}

resource "local_file" "admin_rdp_shortcut" {
  filename = "rdp/管理者.rdp"
  content  = <<EOL
full address:s:${data.azurerm_public_ip.bsverify.ip_address}:3389
prompt for credentials:i:0
administrative session:i:1
username:s:管理者
EOL
}

resource "local_file" "user_rdp_shortcut" {
  filename = "rdp/ユーザー.rdp"
  content  = <<EOL
full address:s:${data.azurerm_public_ip.bsverify.ip_address}:3389
prompt for credentials:i:0
administrative session:i:1
username:s:ユーザー
EOL
}

resource "local_file" "batch_to_add_password_lines_for_rdp_shortcuts" {
  filename = "rdp/add_password.bat"
  content  = <<EOL
@echo off
for /f "usebackq delims==" %%i IN (`dir *.rdp /b`) do powershell.exe -command "'password 51:b:' + (('${var.windows-password}' | ConvertTo-SecureString -AsPlainText -Force) | ConvertFrom-SecureString);" >> %%i
del add_password.bat
EOL
}

resource "local_file" "password_file" {
  filename = "password.txt"
  content  = var.windows-password
}
