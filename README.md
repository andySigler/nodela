#nodela
##A Simple Interface for the Roland MDX-15/20

nodela was developed for PCB fabrication using the MDX-15/20 milling machines. It is an interface for quickly sending PCB designs and toolpaths from an Eagle `.brd` file to the milling machine.

[Video tutorial on preparing your Eagle design for nodela](https://vimeo.com/119003450)

[Video tutorial on setting up and running a job on the Modela](https://vimeo.com/119725323)

##Install

###Installing the node-webkit app on OSX

Recent updates have allowed nodela to connect directly over a serial connection. No more Windows requirement! However, your mill must be connected using a serial cable that works with your computer. [See this tutorial](http://progmatter.com/drupal/?q=node/2) for how to properly connect a serial cable to the Modela's RS-232 output.

Simply download this repository, and run the app by double clicking `node-webkit/Mac/Nodela.app`. The icon can also be dragged down to the dock for to make it easier to start, just like any other app.

###Installing the NodeJS server for other platforms

Nodela can also be run as a simple NodeJS server on other platforms (OSX, Windows, Linux), using the following steps:

NodeJS and npm must already be installed on your computer.

Download  .zip, or using Git:
```
git clone https://github.com/andySigler/nodela
```
Install dependencies with npm:
```
cd nodela
npm install
```
To run with NodeJS from the command line:
```
node nodela.js
```
Open a browser window (Chrome, Firefox, etc) and point it to `localhost:8080`, and the interface will prompt you to drag your `.brd` Eagle file onto the screen.

##Features

####Run straight from your `.brd` Eagle File

No need to export from Eagle. Simply drag and drop your `.brd` file into the browser, and your design will be loaded. The interface is currently searching for only three things in your design file:

 - Wires
 - Part Holes
 - Vias

This means a board will be predominantly shaped by the `Wire` elements found in your design. See [THIS TUTORIAL](https://vimeo.com/119003450) on how to prepare your design for the nodela. For the lazy check out [this ULP](http://mlab.taik.fi/paja/?p=1874), but your final board will be of lower quality.

####Jog the bit to select origin

Mill anywhere on your copper plate by jogging the head around. The interface will also mirror your design for when milling the bottom of your PCB.

####Automatic speed and plunge settings

By selecting the current bit and cut depth, nodela will decide the best settings to run at. This will prevent bits from breaking, and greatly decrease your cut time.

####New Bed Design

Repository also includes a redesigned bed plate, in order to avoid using any tape. The `roland_bed.ai` file inside `./resources` was designed to be laser cut into flat delrin.

With the newly cut delrin plate attached to the Roland, attach a 1/8 inch end mill. Click `Load Facing Plan` in the interface, and run the job to face the delrin and drill holes. Remove the plate when finished, and hammer 4-40 threaded inserts into the holes.