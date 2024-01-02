const { Client } = require('@elastic/elasticsearch');
const { response } = require('express');
const esClient = new Client({ node: 'http://localhost:9200' });
const indexName = 'reut2';


async function checkIndexExistence() { 
  const indexExists = await esClient.indices.exists({ index: indexName });
  esClient.ping().then(() => {
      esClient.indices.exists({ index: indexName }).then(() => {
        console.log(`Index ${indexName} exists: ${indexExists}`);
      })
      
  });
  
}

// Connect
(async () => {
  await checkIndexExistence();
})();

//////////////////////////////////////////////

/**
 * Handles a search request by constructing and executing a complex Elasticsearch query.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const search = async (req, res) => {
  try {
    // Extract user input from the request query
    const query = req.query.query;
    const queryArray = query.split(',').map(item => item.trim());

    // Extract user query, temporal expression, and georeference from the queryArray
    const userQuery = queryArray[0];
    const temporalExpression = queryArray[1]; // Can be null
    const georeference = queryArray[3]; // Can be null

    // Normalize scores
    const normalizeScores = {
      script_score: {
        script: {
          source: "Math.sqrt(1 + _score)"
        }
      }
    };
    
    // Title and content query
    const titleQuery = {
      multi_match: {
        query: userQuery,
        fields: ["title^2", "body"]
      }
    };

    // Temporal expression query
    const temporalQuery = temporalExpression ? {
      nested: {
        path: "temporal_expressions",
        score_mode: "sum",
        query: {
          function_score: {
            query: {
              match: {
                "temporal_expressions.text": temporalExpression
              }
            },
            "functions": [normalizeScores]
          }
        }
      }
    } : null;

    // Georeference query
    const geoQuery = georeference ? {
      nested: {
        path: "georeferences",
        score_mode: "sum",
        query: {
          function_score: {
            query: {
              term: {
                "georeferences.location": georeference
              }
            },
            "functions": [normalizeScores]
          }
        }
      }
    } : null;

    // Combined bool query
    const boolQuery = {
      bool: {
        must: [
          titleQuery,
          temporalQuery,
          geoQuery
        ].filter(Boolean)
      }
    };

    // Main function score query
    const functionScoreQuery = {
      function_score: {
        query: boolQuery,
        functions: [
          // Boosting recent documents
          {
            field_value_factor: {
              field: "date",
              factor: 0.1,
              modifier: "reciprocal"
            }
          },
          normalizeScores
        ],
        score_mode: "sum"
      }
    };

    // Search request
    const searchRequest = {
      index: indexName, // Elasticsearch index name
      body: {
        query: functionScoreQuery
      }
    };

    // Execute the Elasticsearch query
    const hits = await esClient.search(searchRequest);
    const response = hits.hits.hits;

    if (response.length > 0) {
      // Extract and normalize scores
      const referenceScore = response[0]._score;

      const normalizedHits = response.map(hit => ({
        ...hit,
        _normalizedScore: referenceScore !== 0 ? hit._score / referenceScore : 0,
      }));

      // Send the JSON response with the normalized hits
      res.json(normalizedHits);
    } else {
      console.error('Unexpected Elasticsearch response:', body);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    console.error('Error in Elasticsearch search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};




const autocomplete = async (req, res) => {

  try {
    // Input validation
    const query = req.query.query;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Invalid or missing query parameter' });
    }

    const title_query = query.split(',')[0].trim();
    // const temp_query = query.split(',')[1].trim();
    // const georef_query = query.split(',')[2].trim();


    const autocompleteQuery = {
      index: indexName,
      body: {
        query: {
          match: {
            title: {
              query: title_query,
              analyzer:"autocomplete",
              fuzziness: 'AUTO',
            },
          },
        },
      },
    };

    // Execute the Elasticsearch autocomplete query
    // const { body } = await esClient.search(autocompleteQuery);
    // console.log(body)

  
    esClient.search(autocompleteQuery).then(async (response) => { 
      const hits = response.hits.hits;
      Object.keys(hits).forEach((hit) => {
      // console.log(`Hit ${hits[hit]._score} Score:`, hits[hit]._source.title);
    });
    res.json({ hits });
    })

    
    

  } catch (error) {
    // Log the actual Elasticsearch error for debugging purposes
    console.error('Error in Elasticsearch autocomplete:', error.meta ? error.meta.body : error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


const fullContent = async(req,res)=>{
  const { title } = req.query;
  console.log(title)
    try {
      const exactMatch = {
        index: indexName,
        body: {
          query: {
              match_phrase: {
                  title: title,
              },
          },
      },
      };
      esClient.search(exactMatch).then(async (response) => { 
        const hits = response.hits.hits;
      console.log(hits[0]);
      res.send(hits[0]);
      })
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching content');
    }
}
module.exports = { search, autocomplete, fullContent };
