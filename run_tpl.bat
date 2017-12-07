@echo off

set OLDDIR=%CD%
set OLDDRIVE=%~d0

%systemdrive%
cd %appdata%/tiny-tpl-engine

<<<<<<< HEAD
=======
rd temp /s /q
md temp

>>>>>>> 37cd7ac8c230afb3e14c4514b02253f9f86f1aa0
node %appdata%/tiny-tpl-engine/index.js %OLDDIR% && grunt default --path=%OLDDIR% & %OLDDRIVE% & cd %OLDDIR% & pause