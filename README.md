#nodela
##Browser Interface for the Roland-Modela

Nodela was developed for PCB fabrication using the Roland-Modela. It is a browser-based interface for quickly sending PCB designs and toolpaths from an Eagle .brd file to the milling machine.

Repository also includes a redesigned bed plate, in order to avoid using any tape. The _roland_bed.ai_ file inside _./resources_ was designed to be laser cut into flat delrin. Threaded inserts are then hammered in, and washers are used to hold down the PCB.

#####Sofware Features
 - Node.js script
 	- Creates final file and writes to Roland drivers
 - Drag .brd Eagle file into interface to parse the gerber
 	- Recognizes Wires (pre-designed toolpaths)
 	- Recognizes Holes
 	- Recognizes Vias
 - Jog the Roland's head to select the cut's origin

This version must be run on a Window's PC, with the Roland-Modela drivers already installed. Using the Modela without any drivers requires further research. Please contact me if you have any helpful information on this.

###Install

Node.js and npm must already be installed on the Window's PC.

Download  .zip, or using Git:
```
git clone https://github.com/andySigler/nodela
```
Install dependencies with npm:
```
cd nodela
npm install
```
###Use

With 

To run:
```
node app.js
```
Once the script starts, and open your default browser to 'localhost'.