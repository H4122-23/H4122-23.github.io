var dps = require('dbpedia-sparql-client').default;

/**
 * Clean sparql result to plain javascript objects.
 * @param {object} object - The object to clean.
 */
function cleanObject(object) {
    var cleanedObject = {};
    Object.keys(object).forEach(key => {
        var value = object[key].value;
        if (object[key].datatype == "http://www.w3.org/2001/XMLSchema#date") {
            value = new Date(value);
        }
        // Break fields and education into arrays and transform URIs into labels
        if (key == "fields" || key == "education") {
            value = value.split("; ");
            // Remove empty values
            value = value.filter((v) => v != "");
            // Transform URIs into labels
            value = value.map(async (v) => {
                if (!v.startsWith("http")) return { uri: "", label: v };
                return await { uri: v, label: getLabel(v) };
            });
        }
        cleanedObject[key] = value;
    });

    // if thumbnail is not defined, use a placeholder
    if (!cleanedObject.hasOwnProperty("thumbnail")) {
        cleanedObject.thumbnail = "assets/images/place-holder.png";
    }

    return cleanedObject;
}

/**
 * Get the label of a resource.
 * @param {string} uri - The URI of the resource.
 * @returns {string} The label of the resource.
 */
async function getLabel(uri) {
    const query = `
    SELECT DISTINCT ?label
    WHERE {
        <${uri}> rdfs:label ?label.
        FILTER(langMatches(lang(?label), "EN"))
    }`;

    var response = await dps.client().query(query).asJson()
    if (response.results.bindings.length == 0) { return uri; };
    return response.results.bindings[0].label.value;
}

/**
 * Get a random scientist born on this day.
 * @param {number} limit - The number of results to return.
 * @returns {object} The list of scientists.
 */
async function getScientistOfTheDay(limit = 3) {

    // Show loading spinner
    console.log("Loading...");
    document.getElementById("search-icon").classList.add("d-none");
    document.getElementById("loading-spinner").classList.remove("d-none");

    var today = new Date();
    const query = `
    SELECT DISTINCT ?name ?comment ?birthdate ?abstract 
        (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  
        (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
    WHERE {
        ?scientist a dbo:Scientist;
                foaf:name ?name;
                rdfs:comment ?comment;
                dbo:wikiPageWikiLink ?link.
        
        OPTIONAL {?scientist dbo:abstract ?abstract}
        OPTIONAL {?scientist dbo:birthDate ?birthdate}
        OPTIONAL {?scientist dbp:birthDate ?birthdate}
        OPTIONAL {?scientist dbo:academicDiscipline ?fields}
        OPTIONAL {?scientist dbp:education ?education}
        OPTIONAL {?scientist dbp:almaMater ?education}
        OPTIONAL {?scientist foaf:homepage ?homepage}
        OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
        FILTER (?birthdate != "null"^^xsd:date && SUBSTR(STR(?birthdate), 6, 2) = "${today.getMonth() + 1}" && SUBSTR(STR(?birthdate), 9, 2) = "${today.getDate()}")
        FILTER(langMatches(lang(?comment), "EN"))
        FILTER(langMatches(lang(?abstract), "EN"))
    }
    ORDER BY DESC(COUNT(?link))
    LIMIT ${limit}
    `;

    let response = await dps.client().query(query).asJson()
    // Hide loading spinner
    document.getElementById("search-icon").classList.remove("d-none");
    document.getElementById("loading-spinner").classList.add("d-none");
    return response.results.bindings.map(cleanObject);
}

/**
 * Search a scientist by name, institution and field
 * @param {string} name - The name of the scientist to search.
 * @param {string} institution - The name of the institution.
 * @param {string} field - The field
 * @param {number} limit - The number of results to return.
 * @returns {object} The list of scientists.
 */
async function searchScientist(search, limit = 50) {
    let filters = ""; // Build the filters dynamically
    Object.entries(search).forEach(([key, value]) => {
        if (value != "") {
            filters += `FILTER (regex(?${key}, "${value}", "i"))\n`
        }
    });

    const query = `
    SELECT DISTINCT ?name ?comment ?birthdate ?abstract 
        (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  
        (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
    WHERE {
        ?scientist a dbo:Scientist;
                foaf:name ?name;
                rdfs:comment ?comment;
                dbo:wikiPageWikiLink ?link.
        
        OPTIONAL {?scientist dbo:abstract ?abstract}
        OPTIONAL {?scientist dbo:birthDate ?birthdate}
        OPTIONAL {?scientist dbp:birthDate ?birthdate}
        OPTIONAL {?scientist dbo:academicDiscipline ?fields}
        OPTIONAL {?scientist dbp:education ?education}
        OPTIONAL {?scientist dbp:almaMater ?education}
        OPTIONAL {?scientist foaf:homepage ?homepage}
        OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
        ${filters}
        FILTER(langMatches(lang(?comment), "EN"))
        FILTER(langMatches(lang(?abstract), "EN"))
    }
    ORDER BY DESC(COUNT(?link))
    LIMIT ${limit}
    `;

    var response = await dps.client().query(query).asJson()
    return await response.results.bindings.map(cleanObject);
}

/**
 * Search scientists by name.
 * @param {string} name - The name of the scientist to search.
 * @param {number} limit - The number of results to return.
 * @returns {object} The list of scientists.
 */
async function searchScientistByName(name, limit = 50) {
    const query = `
    SELECT DISTINCT ?name ?comment ?birthdate ?abstract 
        (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  
        (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
    WHERE {
        ?scientist a dbo:Scientist;
                foaf:name ?name;
                rdfs:comment ?comment;
                dbo:wikiPageWikiLink ?link.
        
        OPTIONAL {?scientist dbo:abstract ?abstract}
        OPTIONAL {?scientist dbo:birthDate ?birthdate}
        OPTIONAL {?scientist dbp:birthDate ?birthdate}
        OPTIONAL {?scientist dbo:academicDiscipline ?fields}
        OPTIONAL {?scientist dbp:education ?education}
        OPTIONAL {?scientist dbp:almaMater ?education}
        OPTIONAL {?scientist foaf:homepage ?homepage}
        OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
        FILTER (regex(?name, "${name}", "i"))
        FILTER(langMatches(lang(?comment), "EN"))
        FILTER(langMatches(lang(?abstract), "EN"))
    }
    ORDER BY DESC(COUNT(?link))
    LIMIT ${limit}
    `;

    var response = await dps.client().query(query).asJson()
    return await response.results.bindings.map(cleanObject);
}

/**
 * Search scientists by institution
 * @param {string} institution - The name of the institution.
 * @param {number} limit - The number of results to return.
 * @returns {object} The list of scientists.
 */
async function searchScientistByInstitution(institution, limit = 50) {
    const query = `
    SELECT DISTINCT ?name ?comment ?birthdate ?abstract 
    (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  
    (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
    WHERE {
        ?scientist a dbo:Scientist;
                foaf:name ?name;
                rdfs:comment ?comment;
                dbo:wikiPageWikiLink ?link.
        OPTIONAL {?scientist dbo:abstract ?abstract}
        OPTIONAL {?scientist dbo:birthDate ?birthdate}
        OPTIONAL {?scientist dbp:birthDate ?birthdate}
        OPTIONAL {?scientist dbo:academicDiscipline ?fields}
        OPTIONAL {?scientist dbp:education ?education}
        OPTIONAL {?scientist dbp:almaMater ?education}
        OPTIONAL {?scientist foaf:homepage ?homepage}
        OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
        FILTER(regex(?education,"${institution}"))
        FILTER(langMatches(lang(?comment), "EN"))
        FILTER(langMatches(lang(?abstract), "EN"))
    }
    ORDER BY DESC(COUNT(?link))
    LIMIT ${limit}
    `;
    var response = await dps.client().query(query).asJson()
    return await response.results.bindings.map(cleanObject);
}

/**
 * Search scientists by field
 * @param {string} field - The field.
 * @param {number} limit - The number of results to return.
 * @returns {object} The list of scientists.
 */
async function searchScientistByField(field, limit = 50) {
    const query = `
    SELECT DISTINCT ?name ?comment ?birthdate ?abstract 
    (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  
    (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
    WHERE {
        ?scientist a dbo:Scientist;
                foaf:name ?name;
                rdfs:comment ?comment;
                dbo:wikiPageWikiLink ?link.
        OPTIONAL {?scientist dbo:abstract ?abstract}
        OPTIONAL {?scientist dbo:birthDate ?birthdate}
        OPTIONAL {?scientist dbp:birthDate ?birthdate}
        OPTIONAL {?scientist dbo:academicDiscipline ?fields}
        OPTIONAL {?scientist dbp:education ?education}
        OPTIONAL {?scientist dbp:almaMater ?education}
        OPTIONAL {?scientist foaf:homepage ?homepage}
        OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
        FILTER(regex(?fields,"${field}"))
        FILTER(langMatches(lang(?comment), "EN"))
        FILTER(langMatches(lang(?abstract), "EN"))
    }
    ORDER BY DESC(COUNT(?link))
    LIMIT ${limit}
    `;
    var response = await dps.client().query(query).asJson()
    return await response.results.bindings.map(cleanObject);
}


/**
 * Create a card for a scientist.
 * @param {object} object - The scientist to create a card for.
 * @returns {Element} The HTML of the card.
    */
function createCard(object) {
    // Hash the name to get a unique ID for the card.
    var id = object.name.split(" ").join("-").toLowerCase();

    template = `
    <div class="row g-0">
      <a class="col-md-3 m-3" data-bs-toggle="collapse" data-bs-target="#card-details-${id}"
          style="cursor: pointer;">
          <img src="${object.thumbnail}" class="img-fluid rounded-start" style="max-height: 15em;">
      </a>
      <div class="col-md-8 text-start">
          <div class="card-body">
              <h5 class="card-title">${object.name}</h5>
              <p class="card-text">${object.comment}</p>
              <p class="card-text badges"></p>
          </div>
      </div>
    </div>
    <div class="row g-0 p-4 collapse" id="card-details-${id}">
        <p style="text-align: justify;">${object.abstract}</p>
    </div>
  `;
    var card = document.createElement("div");
    card.classList.add("card", "my-3", "mx-4", "shadow-sm");

    card.innerHTML = template;

    // Add onerror event to the image.
    card.getElementsByTagName("img")[0].onerror = function () {
        this.src = "./assets/images/place-holder.png"
    }

    // Add the badges for each field.
    var badges = card.getElementsByClassName("badges")[0];
    object.fields.forEach(field => {
        field.then(f => {
            let badge = createBadge("Loading...", f.uri, "field");

            // if field is a promise, wait for it to resolve.
            if (f.label instanceof Promise) {
                f.label.then(l => badge.innerHTML = l);
            } else { badge.innerHTML = f.label; }

            badges.appendChild(badge);
        });
    });

    // Add the badges for each education.
    object.education.forEach(edu => {
        edu.then(e => {
            let badge = createBadge("Loading...", e.uri, "education");

            // if field is a promise, wait for it to resolve.
            if (e.label instanceof Promise) {
                e.label.then(l => badge.innerHTML = l);
            } else { badge.innerHTML = e.label; }

            badges.appendChild(badge);
        });
    });


    return card;
}

/**
 * Create the cards for a scientist of the day.
 * @param {string} id - The ID of the element to append the cards to.
 */
async function createScientistOfTheDay(id = "scientist-of-the-day") {
    var scientist = await getScientistOfTheDay();
    scientist.forEach((s, i) => {
        var card = createCard(s);
        if (i == 0) { card.classList.add("active"); }
        card.classList.add("carousel-item"); card.classList.remove("my-3", "mx-4");
        document.getElementById(id).appendChild(card);
    });
}

/**
 * Create the cards for the search results.
 * @param {string} id - The ID of the element to append the cards to.
 * @param {number} limit - The number of results to return.
 */
async function createSearchResults(search, id = "search-results", limit = 50) {

    // Show loading spinner
    console.log("Loading...");
    document.getElementById("search-icon").classList.add("d-none");
    document.getElementById("loading-spinner").classList.remove("d-none");

    let scientists = await searchScientist(search, limit)
    document.getElementById(id).innerHTML = "";
    scientists.forEach(s => {
        let card = createCard(s);
        document.getElementById(id).appendChild(card);
    });


    // Hide loading spinner
    document.getElementById("search-icon").classList.remove("d-none");
    document.getElementById("loading-spinner").classList.add("d-none");
}

/**
 * Create a badge from given text.
 * @param {string} text - The text of the badge.
 * @param {string} id - The ID of the badge.
 * @param {string} type - The type of the badge.
 * @returns {Element} The HTML of the badge.
 */
function createBadge(text, uri, type) {
    let badge = document.createElement("span");
    badge.classList.add("badge", "rounded-pill", "m-1", type);
    badge.innerHTML = text;

    if (uri == "") { return badge; }

    // Only if URI exists.
    badge.dataset.uri = uri.split("/").pop();
    badge.style.cursor = "pointer";

    // On click duplicate the badge and add it to the selected badges.
    badge.onclick = function () {

        let selected = document.getElementById(`selected-${type}`);
        let newBadge = this.cloneNode(true);
        newBadge.onclick = function () { this.remove(); }

        selected.innerHTML = "";
        selected.appendChild(newBadge);
    }
    return badge;
}