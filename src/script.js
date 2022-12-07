const form = document.querySelector("form");
const searchInput = document.querySelector("#search-input");
const resultsDiv = document.querySelector("#results");

// Define your SPARQL query as a string
const query = `
        PREFIX ont: <http://dbpedia.org/ontology/>
        SELECT * WHERE {
         ?Scientist a dbo:Scientist .   
        }`;
//     const query = `
//     SELECT ?name ?abstract ?thumbnail
//     WHERE {
//       ?person a dbo:Person.
//       ?person rdfs:label ?name.
//       ?person dbo:abstract ?abstract.
//       ?person dbo:thumbnail ?thumbnail.
//       FILTER(LANG(?abstract) = 'en')
//     }
//   `;

// Define a function that sends the query to the DBpedia SPARQL endpoint
// and returns the results
const search = async (query) => {
  const endpointUrl = "http://dbpedia.org/sparql";
  const fullUrl =
    endpointUrl + "?query=" + encodeURIComponent(query) + "&format=json";

  try {
    const response = await fetch(fullUrl);
    const results = await response.json();

    return results.bindings.map((result) => {
      return {
        name: result.name.value,
        abstract: result.abstract.value,
        thumbnail: result.thumbnail.value,
      };
    });
  } catch (error) {
    console.log(error);
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Get the search query
  const query = searchInput.value;

  // Use the search query to search your database or API
  // and display the results

  const results = await search(query);
  console.log(result);
  resultsDiv.innerHTML = "";
  results.forEach((result) => {
    const resultDiv = document.createElement("div");
    resultDiv.classList.add("result");
    resultDiv.textContent = result.title;
    resultsDiv.appendChild(resultDiv);
  });
});