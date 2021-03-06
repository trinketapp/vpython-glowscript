GlowScript
==========
GlowScript makes it easy to write programs in JavaScript or [VPython](http://vpython.org) (which uses the RapydScript compiler) that generate navigable real-time 3D animations, using the WebGL 3D graphics library available in modern browsers (with modern GPU-based graphics cards). For example, the following complete program creates a 3D canvas in the browser, displays a white 3D cube, creates default lighting, places the camera so that the cube fills the scene, and enables mouse controls to rotate and zoom the camera:

```javascript
   box()
```

That's it. That's the whole program (except for the GlowScript version header line that is supplied automatically). The key point is that lots of well-designed defaults are built into the GlowScript library. You can of course specify the canvas size, the color and other attributes of the objects, the direction of the camera view, etc.

For a history of the development of VPython, see [A time line for VPython development](https://brucesherwood.net/?p=136). Here is a technical overview of GlowScript VPython and VPython 7: [VPython Architecture](https://vpython.org/contents/VPythonArchitecture.pdf).

Documentation
-------------
At [glowscript.org](http://glowscript.org) click Help for full documentation. There is an extensive set of example programs available from the first page of glowscript.org. Programs can be created and stored at glowscript.org, but it is also possible to export a program to place on your own web page, or to use the GlowScript library without storing the program at glowscript.org. For programs stored at glowscript.org, you can share a link with someone and they can run your program simply by clicking on the link. Here is an example:

   https://www.glowscript.org/#/user/GlowScriptDemos/folder/Examples/program/Bounce-VPython

GlowScript was inspired by [VPython](http://vpython.org). The project was begun in 2011 by David Scherer and Bruce Sherwood. Originally programs had to be written in JavaScript, but in November 2014 it became possible to use Python, thanks to the [RapydScript](https://github.com/atsepkov/RapydScript) Python-to-JavaScript compiler created by Alex Tsepkov. GlowScript is now using a later version, [RapydScript-ng](https://github.com/kovidgoyal/rapydscript-ng) developed by Kovid Goyal.

For information related to building the GlowScript application, see MakingNewVersion.txt in the [docs](docs) folder. Also in the [docs](docs) folder is an overview of the GlowScript architecture, [GlowScriptOverview.md](docs/GlowScriptOverview.md).

Sister Project
--------------
VPython 7 lets you run VPython programs in a Jupyter notebook or from program launchers such as IDLE or Spyder: see [vpython.org](https://vpython.org). Its development was initiated by John Coady and further developed by him, Ruth Chabay, Matt Craig, and Bruce Sherwood. The syntax is the same as GlowScript VPython, and it uses the GlowScript 3D graphics library, but VPython 7 runs with an installed standard Python, which provides access to the large number of Python modules. GlowScript VPython does not require installing any software but provides access only to libraries written in JavaScript, not to standard Python modules (it does however provide portions of Python's "random" module).
 
Run Locally
------------------
At glowscript.org, your programs are stored in the cloud and are accessible from anywhere. However, there are times when you might need to write and run programs even when disconnected from the internet.

In this repository, click GlowScriptOffline2.9.zip and download the zip file.

Unzip the GlowScriptOffline package to any convenient place on your computer.

Inside the [GlowScriptOffline](GlowScriptOffline) folder, read the README file to learn how to use the package. 
 
Run a Local Server
------------------
This repository is a Google App Engine application. Here are instructions for running locally, using a local server (this is much more complicated than running locally as described under the previous heading):

   https://www.glowscript.org/docs/GlowScriptDocs/local.html

For Developers
--------------
In this repository's [docs](docs/) folder is a file [GlowScriptOverview.md](docs/GlowScriptOverview.md) that describes the architecture of GlowScript in detail. For many of the current issues, the relevant part of the document is the section on Execution (run-time). To test changes it is necessary to run a local server, as is describe in the previous heading. When you want to run using recent changes, you need to choose a version 0.1 greater than the current version number, and append "dev". For example, if the current version is 2.9, the first line of a test program would be GlowScript 3.0dev VPython.

License
-------
The license is found at [LICENSE.txt](https://github.com/BruceSherwood/glowscript/blob/master/LICENSE.txt).

Early version
------------------------------------------------------------------------------
In December 2014 the original GlowScript repository was corrupted in such a way that it could not be reconstituted, but a backup that contains the history of commits is here:

   https://bitbucket.org/davidscherer/glowscript_backup/overview
