@echo off

set OLDDIR=%CD%
set OLDDRIVE=%~d0

%systemdrive%
cd %appdata%/tiny-tpl-engine

node index.js "%OLDDIR%" && grunt default --path="%OLDDIR%" & %OLDDRIVE% & cd "%OLDDIR%" & pause