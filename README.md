#nodela
##Browser Interface for the Roland MDX-15/20

Nodela was developed for PCB fabrication using the MDX-15/20 milling machines. It is a browser-based interface for quickly sending PCB designs and toolpaths from an Eagle `.brd` file to the milling machine.

###Install

This version must be run on a Window's PC, with the Roland MDX-15/20 drivers already installed. Using the Modela without any drivers requires further research and probably some USB sniffing...

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

To run with node:
```
node nodela.js
```
The script will attempt to open `localhost` in your default browser, and the interface will prompt you to drag your `.brd` Eagle file onto the screen.

When installing the Roland driver, the machine will have been assigned a port name. Mine is called `com3`. To work with your configuration, open `nodela.js` in an editor and edit the following line:

```
var rolandPortName = YOUR_PORT_NAME_HERE;
```

###Features

####Run straight from your `.brd` Eagle File

No need to export from Eagle. Simply drag and drop your `.brd` file into the browser, and your design will be loaded. The interface is currently searching for only three things in your design file:

 - Wires
 - Part Holes
 - Vias

This means a board will be predominantly shaped by the `Wire` elements found in your design. See [THIS TUTORIAL](https://vimeo.com/119003450) on how to prepare your design for the Nodela. For the lazy check out [this ULP](http://mlab.taik.fi/paja/?p=1874), but your final board will be of lower quality.

####Jog the bit to select origin

Mill anywhere on your copper plate by jogging the head around. The interface will also mirror your design for when milling the bottom of your PCB.

####Automatic speed and plunge settings

By selecting the current bit and cut depth, Nodela will decide the best settings to run at. This will prevent bits from breaking, and greatly decrease your cut time.

###Warning
#####(or what nodela does not do)

####Does not interpret arcs or circles

The current interface assumes all `Wires` in your `.brd` file are straight lines. If you want a curve in your mill job, draw tons of little lines.

####Does not interpret the diameter of `Holes` and `Vias`

All `Holes` and `Vias` are milled as if they are a single point. This means the bit will plunge straight down, and the resulting hole will be the diameter of the bit you use. For `Holes`, I like to use a 0.041 inch drill bit, and for `Vias` a 0.0276 inch drill bit (just enough to fit a 24 guage wire through).

###Included in this repo

Repository also includes a redesigned bed plate, in order to avoid using any tape. The `roland_bed.ai` file inside `./resources` was designed to be laser cut into flat delrin. Threaded inserts are then hammered in, and washers are used to hold down the PCB.