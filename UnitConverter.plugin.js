/**
 * @name UnitConverter
 * @author Paulnewbig2
 * @description Converts measurements in chat messages: 75°F (24 °C), 6'2" (188 cm), 10 miles (16 km), 200 lbs (91 kg) and more. Metric or imperial, in brackets or on hover. No network requests.
 * @version 1.0.0
 * @source https://github.com/Paulnewbig2/UnitConverter
 * @website https://github.com/Paulnewbig2/UnitConverter
 * @updateUrl https://raw.githubusercontent.com/Paulnewbig2/UnitConverter/main/UnitConverter.plugin.js
 */

const CACHE_LIMIT = 500;
const LOOKAHEAD = 24;
const NUMBER = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?`;
const BEFORE = String.raw`(?<![\p{L}\p{N}.,'"’])`;
const AFTER = String.raw`(?![\p{L}\p{N}])`;
const FOLLOWING_VALUE = /^\s*(?:[([/=≈~]|or|oder|bzw\.?)?\s*[-−]?\d[\d.,]*\s?/i;
const SEPARATOR = String.raw`\s*(?:[([/=≈~]|or|oder|bzw\.?)\s*$`;

const UNITS = {
    c: { symbol: "°C", hint: /^(?:°\s?C|℃|celsius|C\b)/i },
    f: { symbol: "°F", hint: /^(?:°\s?F|℉|fahrenheit|F\b)/i },
    km: { symbol: "km", hint: /^(?:\bkm\b|kilomet)/i },
    mi: { symbol: "mi", hint: /^(?:\bmi\b|miles?)/i },
    m: { symbol: "m", hint: /^(?:\bm\b|met(?:er|re))/i },
    ft: { symbol: "ft", hint: /^(?:\bft\b|feet|foot|['′])/i },
    cm: { symbol: "cm", hint: /^(?:\bcm\b|centimet|zentimet)/i },
    in: { symbol: "in", hint: /^(?:\bin\b|inch|["″])/i },
    kg: { symbol: "kg", hint: /^(?:\bkg\b|kilo)/i },
    lb: { symbol: "lb", hint: /^(?:\blbs?\b|pounds?)/i },
    g: { symbol: "g", hint: /^(?:\bg\b|gram)/i },
    oz: { symbol: "oz", hint: /^(?:\boz\b|ounces?)/i },
    ml: { symbol: "ml", hint: /^(?:\bml\b|millilit)/i },
    floz: { symbol: "fl oz", hint: /^(?:fl\.?\s?oz|fluid)/i },
    l: { symbol: "L", hint: /^(?:\bL\b|lit(?:er|re))/i },
    gal: { symbol: "gal", hint: /^(?:\bgal\b|gallons?)/i },
    kmh: { symbol: "km/h", hint: /^(?:km\/h|kmh|kph)/i },
    mph: { symbol: "mph", hint: /^(?:mph)/i },
    l100: { symbol: "L/100 km", hint: /^(?:l\/100)/i },
    mpg: { symbol: "mpg", hint: /^(?:mpg)/i },
    m2: { symbol: "m²", hint: /^(?:m²|sqm)/i },
    sqft: { symbol: "sq ft", hint: /^(?:sq\.?\s?ft|ft²)/i },
    ha: { symbol: "ha", hint: /^(?:hectares?|\bha\b)/i },
    acre: { symbol: "acres", hint: /^(?:acres?)/i },
};

const IMPERIAL = [
    { category: "temperature", token: String.raw`°\s?F|℉|degrees?\s+(?:F|fahrenheit)|fahrenheit`, signed: true, to: "c", convert: v => (v - 32) * 5 / 9 },
    { category: "temperature", token: "F", tight: true, exact: true, signed: true, minDigits: 2, to: "c", convert: v => (v - 32) * 5 / 9 },
    { category: "speed", token: String.raw`mph|miles?\s+(?:per|an)\s+hour`, to: "kmh", convert: v => v * 1.609344 },
    { category: "fuel", token: "mpg", to: "l100", convert: v => 235.214583 / v },
    { category: "area", token: String.raw`sq\.?\s?ft|sqft|ft²|square\s+f(?:ee|oo)t`, to: "m2", convert: v => v * 0.09290304 },
    { category: "area", token: String.raw`acres?`, to: "ha", convert: v => v * 0.40468564224 },
    { category: "volume", token: String.raw`fl\.?\s?oz|fluid\s+ounces?`, to: "ml", convert: v => v * 29.5735295625 },
    { category: "volume", token: String.raw`gallons?|gal`, to: "l", convert: v => v * 3.785411784 },
    { category: "distance", token: String.raw`miles?|mi`, to: "km", convert: v => v * 1.609344 },
    { category: "distance", token: String.raw`yards?|yds?`, to: "m", convert: v => v * 0.9144 },
    { category: "distance", token: String.raw`feet|foot|ft`, to: "m", convert: v => v * 0.3048 },
    { category: "distance", token: String.raw`inch(?:es)?|″`, to: "cm", convert: v => v * 2.54 },
    { category: "distance", token: "in", tight: true, exact: true, to: "cm", convert: v => v * 2.54 },
    { category: "distance", token: '"', tight: true, quote: true, to: "cm", convert: v => v * 2.54 },
    { category: "weight", token: String.raw`pounds?|lbs?`, to: "kg", convert: v => v * 0.45359237 },
    { category: "weight", token: String.raw`ounces?|oz`, to: "g", convert: v => v * 28.349523125 },
];

const METRIC = [
    { category: "temperature", token: String.raw`°\s?C|℃|degrees?\s+(?:C|celsius)|celsius|grad\s+celsius`, signed: true, to: "f", convert: v => v * 9 / 5 + 32 },
    { category: "temperature", token: "grad", signed: true, range: [-60, 60], to: "f", convert: v => v * 9 / 5 + 32 },
    { category: "temperature", token: "C", tight: true, exact: true, signed: true, minDigits: 2, to: "f", convert: v => v * 9 / 5 + 32 },
    { category: "speed", token: String.raw`km\/h|kmh|kph|kilomet(?:er|re)s?\s+per\s+hour`, to: "mph", convert: v => v / 1.609344 },
    { category: "fuel", token: String.raw`l\/100\s?km`, to: "mpg", convert: v => 235.214583 / v },
    { category: "area", token: String.raw`m²|sqm|square\s+met(?:er|re)s?|quadratmeter`, to: "sqft", convert: v => v / 0.09290304 },
    { category: "area", token: String.raw`hectares?|hektar`, to: "acre", convert: v => v / 0.40468564224 },
    { category: "distance", token: String.raw`km|kilomet(?:er|re)s?`, to: "mi", convert: v => v / 1.609344 },
    { category: "distance", token: String.raw`cm|centimet(?:er|re)s?|zentimeter`, to: "in", convert: v => v / 2.54 },
    { category: "distance", token: String.raw`met(?:er|re)s?`, to: "ft", convert: v => v / 0.3048 },
    { category: "weight", token: String.raw`kg|kilos?|kilogram(?:me)?s?|kilogramm`, to: "lb", convert: v => v / 0.45359237 },
    { category: "weight", token: String.raw`grams?|grammes?|gramm`, to: "oz", convert: v => v / 28.349523125 },
    { category: "volume", token: String.raw`ml|millilit(?:er|re)s?`, to: "floz", convert: v => v / 29.5735295625 },
    { category: "volume", token: String.raw`lit(?:er|re)s?`, to: "gal", convert: v => v / 3.785411784 },
    { category: "volume", token: "l", tight: true, to: "gal", convert: v => v / 3.785411784 },
    { category: "volume", token: "L", exact: true, to: "gal", convert: v => v / 3.785411784 },
];

const INCH_MARK = String.raw`(?:"|″|''|in|inch(?:es)?)`;
const HEIGHT = new RegExp(String.raw`${BEFORE}([3-7])(?:\s?(?:ft|feet|foot|['′])\s?(\d{1,2})\s?${INCH_MARK}|['′](\d{1,2}))${AFTER}`, "giu");

const CATEGORIES = ["temperature", "distance", "weight", "volume", "speed", "area", "fuel"];

const labels = {
    en: {
        settings_general: "General",
        settings_categories: "What to convert",
        set_language: "Language",
        language_auto: "Automatic (Discord language)",
        set_direction: "Convert to",
        note_redraw: "Changes show up as messages are drawn again, for example after switching channels.",
        direction_auto: "Automatic: imperial for English (US), metric for everyone else",
        direction_metric: "Metric (°C, km, kg, L)",
        direction_imperial: "Imperial (°F, mi, lb, gal)",
        direction_both: "Both ways",
        set_display: "Display",
        display_inline: "In brackets after the value",
        display_tooltip: "Underlined, result on hover",
        set_temperature: "Temperature",
        set_distance: "Length and height",
        set_weight: "Weight",
        set_volume: "Volume",
        set_speed: "Speed",
        set_area: "Area",
        set_fuel: "Fuel consumption",
        stopped: "UnitConverter is not running.",
        no_markdown: "UnitConverter could not find Discord's message renderer. Discord probably changed it, please check for an update.",
    },
    de: {
        settings_general: "Allgemein",
        settings_categories: "Was umgerechnet wird",
        set_language: "Sprache",
        language_auto: "Automatisch (Sprache von Discord)",
        set_direction: "Umrechnen in",
        note_redraw: "Änderungen erscheinen, sobald Nachrichten neu gezeichnet werden, etwa nach einem Kanalwechsel.",
        direction_auto: "Automatisch: imperial bei Englisch (USA), sonst metrisch",
        direction_metric: "Metrisch (°C, km, kg, L)",
        direction_imperial: "Imperial (°F, mi, lb, gal)",
        direction_both: "In beide Richtungen",
        set_display: "Anzeige",
        display_inline: "In Klammern hinter dem Wert",
        display_tooltip: "Unterstrichen, Ergebnis beim Darüberfahren",
        set_temperature: "Temperatur",
        set_distance: "Länge und Körpergröße",
        set_weight: "Gewicht",
        set_volume: "Volumen",
        set_speed: "Geschwindigkeit",
        set_area: "Fläche",
        set_fuel: "Verbrauch",
        stopped: "UnitConverter läuft nicht.",
        no_markdown: "UnitConverter findet Discords Nachrichtenanzeige nicht. Discord hat sie vermutlich geändert, bitte nach einem Update schauen.",
    },
};

const languageNames = { en: "English", de: "Deutsch" };

const defaults = {
    language: "auto",
    direction: "auto",
    display: "inline",
    categories: Object.fromEntries(CATEGORIES.map(category => [category, true])),
};

function compile(spec) {
    const sign = spec.signed ? "[-−]?" : "";
    const gap = spec.tight ? "" : String.raw`\s?`;
    return { ...spec, pattern: new RegExp(`${BEFORE}(${sign}(?:${NUMBER}))${gap}(?:${spec.token})${AFTER}`, spec.exact ? "gu" : "giu") };
}

const COMPILED = { metric: IMPERIAL.map(compile), imperial: METRIC.map(spec => compile({ ...spec, european: true })) };
const TAILS = Object.fromEntries(Object.entries(UNITS).map(([id, unit]) => [id, new RegExp(String.raw`\d\s?(?:${unit.hint.source.slice(4, -1).replace(/(^|\|)\\b/g, "$1")})${SEPARATOR}`, "i")]));

function parseNumber(text, european) {
    const value = text.replace("−", "-");
    if (european && /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(value)) return Number(value.replace(/\./g, "").replace(",", "."));
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(value)) return Number(value.replace(/,/g, ""));
    return Number(value.replace(",", "."));
}

function scale(value, unit) {
    const abs = Math.abs(value);
    if (unit === "g" && abs >= 1000) return [value / 1000, "kg"];
    if (unit === "ml" && abs >= 1000) return [value / 1000, "l"];
    if (unit === "m" && abs < 1) return [value * 100, "cm"];
    if (unit === "m" && abs >= 1000) return [value / 1000, "km"];
    if (unit === "km" && abs < 1) return [value * 1000, "m"];
    if (unit === "in" && abs >= 108) return [value / 12, "ft"];
    if (unit === "cm" && abs >= 1000) return [value / 100, "m"];
    if (unit === "oz" && abs >= 16) return [value / 16, "lb"];
    if (unit === "ft" && abs >= 5280) return [value / 5280, "mi"];
    if (unit === "floz" && abs >= 128) return [value / 128, "gal"];
    return [value, unit];
}

module.exports = class UnitConverter {
    constructor(meta) {
        this.api = new BdApi(meta.name);
        this.cache = new Map();
    }

    get localeName() {
        return this.locale?.locale ?? document.documentElement.lang ?? "en-US";
    }

    get t() {
        const chosen = this.settings?.language;
        const base = (chosen && chosen !== "auto" ? chosen : this.localeName).toLowerCase().split("-")[0];
        return { ...labels.en, ...labels[base in labels ? base : "en"] };
    }

    get directions() {
        const direction = this.settings.direction === "auto" ? (this.localeName === "en-US" ? "imperial" : "metric") : this.settings.direction;
        return direction === "both" ? ["metric", "imperial"] : [direction];
    }

    start() {
        const { Webpack, Patcher, DOM, Data, UI } = this.api;
        const saved = Data.load("settings") ?? {};
        this.locale = Webpack.getStore("LocaleStore");
        this.markdown = Webpack.getModule(m => m && typeof m === "object" && typeof m.reactParserFor === "function" && typeof m.parseToAST === "function", { searchExports: true });
        const rules = this.markdown?.defaultRules;
        if (typeof rules?.text?.react !== "function") {
            UI.showToast(this.t.no_markdown, { type: "error" });
            return;
        }
        this.settings = { ...defaults, ...saved, categories: { ...defaults.categories, ...saved.categories } };

        DOM.addStyle(`
            .unitconverter-value { color: var(--text-muted, #949ba4); }
            .unitconverter-measure { text-decoration: underline dotted; text-underline-offset: 3px; cursor: help; }
        `);

        Patcher.after(rules.text, "react", (_, __, result) => this.convert(result));
        this.markdown.parse = this.markdown.reactParserFor(rules);
    }

    stop() {
        this.api.Patcher.unpatchAll();
        this.api.DOM.removeStyle();
        if (this.markdown?.defaultRules) this.markdown.parse = this.markdown.reactParserFor(this.markdown.defaultRules);
        this.cache.clear();
        this.settings = null;
    }

    convert(result) {
        if (!this.settings || typeof result?.props?.children !== "string") return result;
        const parts = this.render(result.props.children);
        return parts ? this.api.React.cloneElement(result, undefined, ...parts) : result;
    }

    format(value, unit, decimals) {
        const [scaled, finalUnit] = scale(value, unit);
        const abs = Math.abs(scaled);
        const digits = decimals ?? (abs >= 10 ? 0 : abs >= 1 ? 1 : 2);
        const number = new Intl.NumberFormat(this.localeName, { maximumFractionDigits: digits }).format(scaled);
        return { output: `${/^[-−]0$/.test(number) ? "0" : number} ${UNITS[finalUnit].symbol}`, units: [unit, finalUnit] };
    }

    height(totalInches) {
        const rounded = Math.round(totalInches);
        return { output: `${Math.floor(rounded / 12)}′${rounded % 12}″`, units: ["in", "ft"] };
    }

    alreadyConverted(text, item) {
        const before = text.slice(Math.max(0, item.start - LOOKAHEAD), item.start);
        if (item.units.some(unit => TAILS[unit].test(before))) return true;
        const rest = text.slice(item.end, item.end + LOOKAHEAD);
        const lead = rest.match(FOLLOWING_VALUE);
        return !!lead && item.units.some(unit => UNITS[unit].hint.test(rest.slice(lead[0].length)));
    }

    findAll(text) {
        const found = [];
        const enabled = this.settings.categories;
        const directions = this.directions;

        if (enabled.distance && directions.includes("metric")) {
            for (const match of text.matchAll(HEIGHT)) {
                const raw = match[2] ?? match[3];
                const inches = Number(raw);
                if (inches < 12 && !(raw.length === 2 && raw.startsWith("0"))) found.push({ start: match.index, end: match.index + match[0].length, ...this.format(Number(match[1]) * 30.48 + inches * 2.54, "cm", 0) });
            }
        }

        for (const direction of directions) {
            for (const spec of COMPILED[direction]) {
                if (!enabled[spec.category]) continue;
                for (const match of text.matchAll(spec.pattern)) {
                    const value = parseNumber(match[1], spec.european);
                    if (!Number.isFinite(value) || (spec.to === "l100" || spec.to === "mpg") && value === 0) continue;
                    if (spec.minDigits && match[1].replace(/^[-−]/, "").split(/[.,]/)[0].length < spec.minDigits) continue;
                    if (spec.range && (value < spec.range[0] || value > spec.range[1])) continue;
                    if (spec.quote && (text.match(/"/g)?.length ?? 0) % 2 === 0) continue;
                    const converted = spec.convert(value);
                    const decimals = spec.category === "temperature" ? (match[1].match(/[.,]\d/) ? 1 : 0) : undefined;
                    const result = spec.to === "in" && converted >= 47.5 && converted < 107.5 ? this.height(converted) : this.format(converted, spec.to, decimals);
                    found.push({ start: match.index, end: match.index + match[0].length, ...result });
                }
            }
        }

        found.sort((a, b) => a.start - b.start || b.end - a.end);
        const kept = [];
        for (const item of found) {
            if (kept.length && item.start < kept[kept.length - 1].end) continue;
            if (this.alreadyConverted(text, item)) continue;
            kept.push(item);
        }
        return kept;
    }

    render(text) {
        if (!/\d/.test(text)) return null;
        if (this.cache.has(text)) return this.cache.get(text);

        const found = this.findAll(text);
        let parts = null;
        if (found.length) {
            const { React, Components } = this.api;
            parts = [];
            let position = 0;
            for (const item of found) {
                if (item.start > position) parts.push(text.slice(position, item.start));
                const original = text.slice(item.start, item.end);
                if (this.settings.display === "tooltip") {
                    parts.push(React.createElement(Components.Tooltip, { text: item.output, position: "top" }, props => React.createElement("span", { ...props, className: "unitconverter-measure", tabIndex: 0, "aria-label": `${original} = ${item.output}` }, original)));
                } else {
                    parts.push(original, React.createElement("span", { className: "unitconverter-value" }, ` (${item.output})`));
                }
                position = item.end;
            }
            if (position < text.length) parts.push(text.slice(position));
        }

        if (this.cache.size >= CACHE_LIMIT) this.cache.delete(this.cache.keys().next().value);
        this.cache.set(text, parts);
        return parts;
    }

    getSettingsPanel() {
        if (!this.settings) return this.api.React.createElement("div", null, labels.en.stopped);

        const t = this.t;
        return this.api.UI.buildSettingsPanel({
            settings: [
                {
                    type: "category",
                    id: "general",
                    name: t.settings_general,
                    collapsible: true,
                    shown: true,
                    settings: [
                        { type: "dropdown", id: "language", name: t.set_language, value: this.settings.language, options: [{ label: t.language_auto, value: "auto" }, ...Object.entries(languageNames).map(([value, label]) => ({ label, value }))] },
                        { type: "dropdown", id: "direction", name: t.set_direction, note: t.note_redraw, value: this.settings.direction, options: ["auto", "metric", "imperial", "both"].map(value => ({ label: t[`direction_${value}`], value })) },
                        { type: "dropdown", id: "display", name: t.set_display, value: this.settings.display, options: ["inline", "tooltip"].map(value => ({ label: t[`display_${value}`], value })) },
                    ],
                },
                {
                    type: "category",
                    id: "categories",
                    name: t.settings_categories,
                    collapsible: true,
                    shown: true,
                    settings: CATEGORIES.map(id => ({ type: "switch", id, name: t[`set_${id}`], value: this.settings.categories[id] })),
                },
            ],
            onChange: (group, id, value) => {
                if (group === "categories" && id in defaults.categories) this.settings.categories[id] = value;
                else if (group === "general" && id in defaults) this.settings[id] = value;
                else return;
                this.api.Data.save("settings", this.settings);
                this.cache.clear();
            },
        });
    }
};
