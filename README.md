# Bitburner-Scripts
My scripts for bitburner
NOTE: The batchprep script tells the batch script when it's finished using ports, and the port used is the host server's last digit.
It will not work if your host server's name does not end in a digit, or if you run the script on two different servers with the same last digit.
(I made it this way to be easy to use with my Pservs, which are named 'server1', 'server2', etc.)
You could probably change the port used to be the full server name and avoid such issues if you map the name to a number (because ports have to be numbers)
