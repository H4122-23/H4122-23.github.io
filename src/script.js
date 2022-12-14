function transformString(str) {
  return str.replace(/\b[a-z]/g, function(letter) {
    return letter.toUpperCase();
  });
}

function rechercher(search_word, result_id) {
  var contenu_requete = 
`
  SELECT DISTINCT ?scientist ?scientistLabel
  WHERE
  {
    ?scientist wdt:P31 wd:Q5. 
    ?scientist wdt:P106 wd:Q901.
    ?scientist rdfs:label ?scientistLabel
    FILTER(lang(?scientistLabel) = "en")
    FILTER(regex(?scientistLabel, "${search_word}","i")) 
  }
  ORDER BY ?scientistLabel
  LIMIT 100
`;
  // Encodage de l'URL à transmettre à DBPedia
  var url_base = "http://query.wikidata.org/sparql";
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