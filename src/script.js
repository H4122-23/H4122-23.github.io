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

function findScientistOfTheDay(result_id){
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

function rechercher(search_word, result_id) {
  var contenu_requete = 
  `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
  PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>

  SELECT ?scientist
  WHERE {
    ?scientist a dbpedia-owl:Scientist; foaf:name ?name.
    FILTER(regex(?name, "${transformString(search_word)}"))
  }
  LIMIT 100`;
 
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
  console.log(result_id)
  // Tableau pour mémoriser l'ordre des variables ; sans doute pas nécessaire
  // pour vos applications, c'est juste pour la démo sous forme de tableau
  var index = [];

  var contenuTableau = "<tr>";

  data.head.vars.forEach((v, i) => {
    contenuTableau += "<th>" + v + "</th>";
    index.push(v);
  });

  data.results.bindings.forEach(r => {
    contenuTableau += "<tr>";

    index.forEach(v => {

      if (r[v]) {
        if (r[v].type === "uri") {
          contenuTableau += "<td><a href='" + r[v].value + "' target='_blank'>" + r[v].value + "</a></td>";
        }
        else {
          contenuTableau += "<td>" + r[v].value + "</td>";
        }
      }
      else {
        contenuTableau += "<td></td>";
      }

    });


    contenuTableau += "</tr>";
  });


  contenuTableau += "</tr>";

  document.getElementById(result_id).innerHTML = contenuTableau;

}