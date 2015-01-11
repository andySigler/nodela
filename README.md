#nodela
##Browser Interface for the Roland-Modela

Nodela was developed for PCB fabrication using the Roland-Modela. It is a browser-based interface for quickly sending PCB designs and toolpaths from an Eagle .brd file to the milling machine.

 - Node.js script writes files to Roland drivers
 - Load your your Eagle .brd file by dragging into the browser
 - Interface recognizes
 	- Wires (pre-designed toolpaths)
 	- Holes
 	- Vias

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