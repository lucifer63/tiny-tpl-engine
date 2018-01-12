@echo off

%SYSTEMDRIVE%
cd %appdata%
git clone https://github.com/lucifer63/tiny-tpl-engine.git
cd tiny-tpl-engine
git pull
npm install
npm update

pause