const $ = (query) => {
    if (typeof query === "string") {
        return document.querySelector(query);
    } else if (typeof query === "function")
        document.addEventListener("DOMContentLoaded", query);
};
const $$ = (query) => document.querySelectorAll(query);

window.$ = $;
window.$$ = $$;

const MEASUREMENTS = ["length", "weight", "temperature"];

const VALUES = {
    length: {
        milimeter: { value: 0.001, symbol: "mm" },
        centimiter: { value: 0.01, symbol: "cm" },
        meter: { value: 1, symbol: "m" },
        kilometer: { value: 1000, symbol: "km" },
        inch: { value: 0.0254, symbol: "″" },
        foot: { value: 0.3048, symbol: "ft" },
        yard: { value: 0.9144, symbol: "yd" },
        mile: { value: 1609.34, symbol: "mi" },
    },
    weight: {
        miligram: { value: 0.001, symbol: "mg" },
        gram: { value: 1, symbol: "g" },
        kilogram: { value: 1000, symbol: "kg" },
        ounce: { value: 28.3495, symbol: "oz" },
        pound: { value: 453.592, symbol: "lb" },
    },
    temperature: {
        celsius: { value: 1, symbol: "°C" },
        fahrenheit: { value: "(celsius * (9/5)) + 32", symbol: "°F" },
        kelvin: { value: "celsius + 273.15", symbol: "K" },
        "kelvin-celsius": { value: "kelvin - 273.15", symbol: "°C" },
        "fahrenheit-celsius": {
            value: "((fahrenheit - 32) * 5) / 9",
            symbol: "°C",
        },
    },
};

// Elements
const $formDiv = $("#form");
const $navigation = $("nav");

const loadForm = (file) => {
    fetch(`forms/${file}.html`)
        .then((resp) => resp.text())
        .then((rawHTML) => {
            $("#result").classList.remove("show");
            $("#form").innerHTML = rawHTML;
            $$(".nav-item.active").forEach((el) =>
                el.classList.remove("active")
            );
            $(`.nav-item[data-form="${file}"]`).classList.add("active");
            loadSelects(file);

            $("#form form").onsubmit = (event) => {
                event.preventDefault();

                const valuefrom = $("input[name='value']").value;
                const unitfrom = $("select[name='unitfrom']").value;
                const unitto = $("select[name='unitto']").value;

                const result = convert(
                    file,
                    { fromV: valuefrom, fromM: unitfrom },
                    unitto
                );

                $("#result").innerHTML = `
                    <p>Result of yout calculation</p>
                    <span>${result[0]} ${result[1]} = ${result[2]} ${result[3]}</span>
                    <button onclick="$('#result').classList.remove('show')">Reset</button>
                `;

                $("#result").classList.add("show");
            };
        })
        .catch((err) => console.error(err));
};

const loadSelects = (form) => {
    const from = $("select[name='unitfrom']");
    const to = $("select[name='unitto']");
    let symbols = [];

    from.innerHTML = `
        ${Object.entries(VALUES[form]).map((el) => {
            let toappend = !symbols.includes(el[1].symbol)
                ? `<option value="${el[0]}">${el[1].symbol}</option>`
                : "";

            symbols.push(el[1].symbol);

            return toappend;
        })}
    `;

    symbols = [];

    to.innerHTML = `
        ${Object.entries(VALUES[form]).map((el) => {
            let toappend = !symbols.includes(el[1].symbol)
                ? `<option value="${el[0]}">${el[1].symbol}</option>`
                : "";

            symbols.push(el[1].symbol);

            return toappend;
        })}
    `;
};

const convert = (measurement, { fromM, fromV }, toM) => {
    fromV = Number(fromV);
    if (!MEASUREMENTS.find((el) => el === measurement))
        throw new Error("That measurement does not exist");

    if (!VALUES[measurement][fromM] || !VALUES[measurement][toM])
        throw new Error("One of the given units does not exist");

    if (
        typeof VALUES[measurement][fromM]?.value === "number" &&
        typeof VALUES[measurement][toM]?.value === "number"
    ) {
        const oneValue = Object.keys(VALUES[measurement]).find(
            (key) => VALUES[measurement][key].value === 1
        );

        const fromRealValue = fromV * VALUES[measurement][fromM].value;
        const toRealValue = fromRealValue / VALUES[measurement][toM].value;

        return [
            fromV,
            VALUES[measurement][fromM].symbol,
            Math.round(toRealValue * 1000000) / 1000000,
            VALUES[measurement][toM].symbol,
        ];
    } else {
        const oneValue = Object.keys(VALUES[measurement]).find(
            (key) => VALUES[measurement][key].value === 1
        );
        if (fromM === oneValue) {
            return [
                fromV,
                VALUES[measurement][fromM].symbol,
                eval(
                    `const ${oneValue} = ${fromV}; ${VALUES[measurement][toM].value}`
                ),
                VALUES[measurement][toM].symbol,
            ];
        } else {
            const fromRealValue = eval(
                `const ${fromM} = ${fromV}; ${
                    VALUES[measurement][`${fromM}-${oneValue}`].value
                }`
            );
            const toRealValue =
                typeof VALUES[measurement][toM].value === "string"
                    ? eval(
                          `const ${oneValue} = ${fromRealValue}; ${VALUES[measurement][toM].value}`
                      )
                    : VALUES[measurement][toM].value * fromRealValue;

            console.log(
                { fromRealValue, toRealValue },
                `const ${fromM} = ${fromV}; ${
                    VALUES[measurement][`${fromM}-${oneValue}`].value
                }`
            );

            return [
                fromV,
                VALUES[measurement][fromM].symbol,
                Math.round(toRealValue * 1000000) / 1000000,
                VALUES[measurement][toM].symbol,
            ];
        }
    }
};

$(() => {
    $navigation.innerHTML = MEASUREMENTS.map((mes) => {
        return `<div class="nav-item" data-form="${mes}">${
            mes.charAt(0).toUpperCase() + mes.slice(1)
        }</div>`;
    }).join("");

    $$(".nav-item").forEach((el) => {
        el.addEventListener("click", () => {
            loadForm(el.dataset["form"]);
        });
    });

    loadForm(MEASUREMENTS[0]);
});

console.log(convert("temperature", { fromM: "celsius", fromV: 20 }, "kelvin"));
