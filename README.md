# UnitConverter

A BetterDiscord plugin that converts measurements in chat messages. When someone writes 75°F, you read 75°F (24 °C). Works the other way round too.

## What it converts

| Type | Imperial | Metric |
| :- | :- | :- |
| Temperature | °F, degrees F, Fahrenheit, 75F | °C, degrees C, Celsius, 20C, Grad (from -60 to 60, so angles like 180 Grad stay) |
| Length | mi, miles, yd, ft, feet, 12in, inches, 12" | km, meters, cm, Kilometer, Zentimeter |
| Body height | 6'2", 5 ft 4 in, 5'11 | 180 cm becomes 5′11″ |
| Weight | lb, lbs, pounds, oz, ounces | kg, kilos, grams, Gramm |
| Volume | gal, gallons, fl oz | 2L, 2 L, liters, ml |
| Speed | mph, miles per hour | km/h, kmh, kph |
| Area | sq ft, square feet, acres | m², square meters, hectares |
| Fuel consumption | mpg | L/100 km |

Details:
- Numbers like 1,500 lbs and 5,5 kg are read correctly
- Results are rounded to what makes sense: 24 °C, 16 km, 7.8 L/100 km, 0.53 gal
- Large and small results switch units: 2,000 g becomes 2 kg, 3 ft becomes 91 cm
- Already converted values are left alone: in "75°F (24°C)" and "20 °C / 68 °F" nothing is added
- A bare m is not read as meters and a bare in only directly after the number, because both mean other things in chat ("15 m ago", "5 in the morning")
- Temperatures written as 20C or 75F need two digits, so "room 4C" stays
- Code blocks and inline code are not touched
- Quotation marks are not read as inches: in my "top 5" list nothing is added

## Settings

| Setting | Options |
| :- | :- |
| Convert to | automatic / metric / imperial / both ways. Automatic means imperial if your Discord language is English (US), metric for everyone else |
| Display | in brackets after the value / underlined with the result on hover |
| Types | each of the seven types above can be turned off |
| Language of the settings | automatic / English / German |

Numbers are formatted in your Discord language, for example 2,4 km in German.

## Installation

1. Download [UnitConverter.plugin.js](https://github.com/Paulnewbig2/UnitConverter/releases/latest/download/UnitConverter.plugin.js) from the latest release
2. Put it into your BetterDiscord plugins folder (User Settings → Plugins → Open Plugins Folder)
3. Enable it in User Settings → Plugins

## Privacy

Everything happens on your PC. The plugin makes no network requests.

## Support

Bug reports and missing units: [GitHub issues](https://github.com/Paulnewbig2/UnitConverter/issues). Please include the message text that was converted wrongly.

## License

[MIT](LICENSE)
