function transformString(str) {
  return str.replace(/\b[a-z]/g, function(letter) {
    return letter.toUpperCase();
  });
}

function createSparqlQuery(predicate, object) {
return `PREFIX dbo: <http://dbpedia.org/ontology/>
SELECT * 
WHERE 
{
  ?scientist a dbo:Scientist.
  ?scientist ${predicate} "${object}".
}
ORDER BY ?scientistLabel
LIMIT 100`
;
}

// Fill missing thumbnail with a placeholder, replace if dead link
function checkThumbnailLink(object) {
  var link = "";
  if (!object.hasOwnProperty("thumbnail")) { link = "asset/place-holder.png"; }
  else { link = object.thumbnail.value; }

  // Check if thumbnail is dead
  var img = new Image();
  img.onerror = function() {img.src = "asset/place-holder.png"; console.log("dead link");}
  img.src = link;

  return img.src;
}

function createCard(object) {
  object.thumbnail = checkThumbnailLink(object);
  template = `
  <div class="card">
    <div class="row g-0">
      <a class="col-md-3 m-3" data-bs-toggle="collapse" data-bs-target="#card-details-01"
          style="cursor: pointer;">
          <img src="${ object.thumbnail }" class="img-fluid rounded-start" style="max-height: 15em;">
      </a>
      <div class="col-md-8 text-start">
          <div class="card-body">
              <h5 class="card-title">${object.name.value}</h5>
              <p class="card-text">${object.comment.value}</p>
              <p class="card-text badges"></p>
              <p class="card-text"><small class="text-muted fst-italic">${object.fields.value}</small></p>
          </div>
      </div>
    </div>
    <div class="row g-0 p-4 collapse" id="card-details-01">
        <p style="text-align: justify;"></p>
    </div>
  </div>
  `;
  // Create a new element from the template
  var element = document.createElement("div");
  element.innerHTML = template;

  // Create fidlds badges
  var fields = object.fields.value.split("; ");
  console.log(fields);
  var fieldsContainer = element.querySelector(".badges");

  fields.forEach(field => {
    if (field == "") return;
    var badge = document.createElement("span");
    badge.classList.add("badge", "rounded-pill", "text-bg-primary");
    // Keep only last part of the URI
    field = field.split("/").pop();
    badge.innerHTML = field;
    fieldsContainer.appendChild(badge);
  });

  // Create education badges
  var education = object.education.value.split("; ");
  console.log(education);
  var educationContainer = element.querySelector(".badges");
  education.forEach(school => {
    if (school == "") return;
    var badge = document.createElement("span");
    badge.classList.add("badge", "rounded-pill", "text-bg-danger");
    // Keep only last part of the URI
    school = school.split("/").pop();
    badge.innerHTML = school;
    educationContainer.appendChild(badge);
  });

  return element;
}

function findScientistOfTheDay(){
  console.log("findScientistOfTheDay");
  var contenu_requete = 
  `PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX : <http://dbpedia.org/resource/>
  PREFIX dbpedia2: <http://dbpedia.org/property/>
  PREFIX dbpedia: <http://dbpedia.org/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX dbo: <http://dbpedia.org/ontology/>
  
  SELECT DISTINCT ?name ?comment  ?birthdate  (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
  WHERE {
    ?scientist a dbo:Scientist;
              foaf:name ?name;
              rdfs:comment ?comment;
              dbo:wikiPageWikiLink ?link .
    OPTIONAL {?scientist dbo:birthDate ?birthdate}
    OPTIONAL {?scientist dbp:birthDate ?birthdate}
    OPTIONAL {?scientist dbo:academicDiscipline ?fields}
    OPTIONAL {?scientist dbp:education ?education}
    OPTIONAL {?scientist dbp:almaMater ?education}
    OPTIONAL {?scientist foaf:homepage ?homepage}
    OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
    FILTER (?birthdate != "null"^^xsd:date && SUBSTR(STR(?birthdate), 6, 2) = "12" && SUBSTR(STR(?birthdate), 9, 2) = "12")
    FILTER(langMatches(lang(?comment), "EN"))
  }
  ORDER BY DESC(?link)
  LIMIT 50`;
   // Encodage de l'URL à transmettre à DBPedia
   var url_base = "http://dbpedia.org/sparql";
   var url = url_base + "?query=" + encodeURIComponent(contenu_requete) + "&format=json";
 
   // Requête HTTP et affichage des résultats
   var xmlhttp = new XMLHttpRequest();
   xmlhttp.onreadystatechange = function () {
     if (this.readyState == 4 && this.status == 200) {
       var result = JSON.parse(this.responseText);
       console.log(result);
       objects = result.results.bindings;
       // Choose only 3 objects randomly
        objects = objects.sort(() => Math.random() - 0.5).slice(0, 3);

       // For each object, create a card and append it to the scientist of the day section
       // Iterate over the  3 objects with index
        objects.forEach((object, index) => {
          var card = createCard(object);
          // get scientist of the day section inner carousel
          var carousel = document.getElementById("scientistOfTheDay").getElementsByClassName("carousel-inner")[0];
          // create a new carousel item
          var carouselItem = document.createElement("div");
          carouselItem.className = "carousel-item";
          // if index is 0, add active class to the carousel item
          if(index == 0){
            carouselItem.className += " active";
          }
          // append the card to the carousel item
          carouselItem.appendChild(card);
          // append the carousel item to the carousel
          carousel.appendChild(carouselItem);
        });

     }
   };
   xmlhttp.open("GET", url, true);
   xmlhttp.send();
}

function rechercher(search_word, result_id) {
 
  var contenu_requete = 
  `PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX dc: <http://purl.org/dc/elements/1.1/>
  PREFIX : <http://dbpedia.org/resource/>
  PREFIX dbpedia2: <http://dbpedia.org/property/>
  PREFIX dbpedia: <http://dbpedia.org/>
  PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX dbo: <http://dbpedia.org/ontology/>
  
  SELECT DISTINCT ?name ?comment  ?birthdate  (GROUP_CONCAT( DISTINCT ?education; separator = "; ") AS ?education)  (GROUP_CONCAT( DISTINCT ?fields; separator = "; ") AS ?fields) ?homepage ?thumbnail
  WHERE {
    ?scientist a dbo:Scientist;
              foaf:name ?name;
              rdfs:comment ?comment;
              dbo:wikiPageWikiLink ?link .
    OPTIONAL {?scientist dbo:birthDate ?birthdate}
    OPTIONAL {?scientist dbp:birthDate ?birthdate}
    OPTIONAL {?scientist dbo:academicDiscipline ?fields}
    OPTIONAL {?scientist dbp:education ?education}
    OPTIONAL {?scientist dbp:almaMater ?education}
    OPTIONAL {?scientist foaf:homepage ?homepage}
    OPTIONAL {?scientist dbo:thumbnail ?thumbnail}
    FILTER(regex(?name, "${transformString(search_word)}"))
    FILTER(langMatches(lang(?comment), "EN"))
  }
  ORDER BY DESC(?link)
  LIMIT 50`;
 
  // Encodage de l'URL à transmettre à DBPedia
  var url_base = "http://dbpedia.org/sparql";
  var url = url_base + "?query=" + encodeURIComponent(contenu_requete) + "&format=json";

  // Requête HTTP et affichage des résultats
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var results = JSON.parse(this.responseText);
      console.log(results)
      // Display loading spinner #loading-spinner
    document.getElementById("loading-spinner").classList.add("d-none");
    document.getElementById("search-icon").classList.remove("d-none");
      afficherResultats(results, result_id);
    }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
  // Display loading spinner #loading-spinner
  document.getElementById("loading-spinner").classList.remove("d-none");
    document.getElementById("search-icon").classList.add("d-none");
}

// Affichage des résultats dans un tableau
function afficherResultats(data, result_id) {
  console.log(data);
  // Create a new card for each result
  // get the result section
  var resultSection = document.getElementById(result_id);
  // clear the result section
  resultSection.innerHTML = "";
  // iterate over the results
  data.results.bindings.forEach((result, index) => {
    // create a new card
    var card = createCard(result);
    // Add margin to the card
    card.classList.add("mx-5");
    card.classList.add("my-3");
    // append the card to the result section
    resultSection.appendChild(card);
  });
}