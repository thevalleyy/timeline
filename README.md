# timeline

dynamically generate cards in the style of the game [timeline](https://www.dobblegame.com/en/games/timeline-classic/). Take a look at [timeline.pdf](./timeline.pdf) to find out how cards will look!

⚠️ This repository won't receive any maintenance or further support due to [pdf-lib](https://pdf-lib.js.org/) being unmaintained itself. Also, I've found it very frustrating to generate pdf using any js library. In the future I'll use [WeasyPrint](https://github.com/Kozea/WeasyPrint/) for things like that.

## Setup

Clone the repository, cd into it and install npm

```sh
git clone https://github.com/thevalleyy/timeline.git
cd timeline/
npm i
```

## Configuration

The card design can be configured in `data.json`. All attributes at the `config` key can be dynamically changed, and the design will adapt as good as possible. All the attributes are named in a way it's obvious to see what they do. E.g., `attributionFont` will be used when drawing the attribution text, or `cardHeightMM` will be the height in mm.

There are also categories that can be configured.

```json
"0": {
    "name": "Space flight",
    "color": "#FF5555"
},
```

## Building the cards

Every card is defined in a JSON-Object.

```json
{
    "event": "Something happened",
    "year": "2026",
    "description": "Yeah, something happened. This text is supposed to describe the event. You get it!",
    "image": "astronaut.png",
    "attribution": "NASA, Public domain, via Wikimedia Commons"
}
```

I think everything here is self-explanatory, except the image. You have an image folder at the project root (`/images`). In there you can put PNGs or JPEGs and reference them there. Specifying no image will result in a mostly white front side, with only the event and the attribution (which makes no sense to not also leave empty). The description supports **\*\*bold\*\*** and _\_\_italics\_\__ styling, but that's kind of broken.

All these card-objects are expected to be put into an array and specified at the `data` key in `data.json`.

I have provided a minimal working example at `data.json`. A complete set of 40 cards in German language can be found at `data_.json`.

## Generating the pdf

All you have to do is run `node .`. The console may display errors, like when you specify images that don't exist in the image folder.

The last step is to actually print the pdf file, fold the cards so there's a front and back side and maybe laminate them or something like that (yes, we usually do that over here 🇩🇪).
