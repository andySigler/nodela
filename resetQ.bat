echo Start
sc stop spooler
ping localhost -n 2
sc stop lxbk_device
ping localhost -n 2
taskkill /im lxbk* /f /t
ping localhost -n 2
del /q c:\Windows\system32\spool\PRINTERS\*
ping localhost -n 2
sc start lxbk_device
ping localhost -n 2
sc start spooler
echo End
pause