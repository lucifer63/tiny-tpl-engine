@echo off

set OLDDIR=%CD%
set OLDDRIVE=%~d0

%systemdrive%
cd %appdata%/tiny-tpl-engine

rd temp /s /q
md temp

node %appdata%/tiny-tpl-engine/index.js %OLDDIR% && grunt default --path=%OLDDIR% & %OLDDRIVE% & cd %OLDDIR% & pause