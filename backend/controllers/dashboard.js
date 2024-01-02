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


////////////////////////////////////////////////////////////

/**
 * Retrieves the top 10 mentioned locations along with their top coordinates from Elasticsearch.
 * @returns {Array} An array of top location buckets, each containing information about the location and its top coordinates.
 */
async function getTop10MentionedLocations() {
    try {
       // Execute an Elasticsearch search query
      const response = await esClient.search({
        index: indexName,
        body: {
          size: 0, // Return only aggregations, not search results
          aggs: {
            top_locations: {
              nested: {
                path: 'georeferences',  // Nested path for georeferences
              },
              aggs: {
                locations: {
                  terms: {
                    field: 'georeferences.location', // Field for terms aggregation
                    size: 10, // Limit the number of buckets to 10
                  },
                  aggs: {
                    top_coordinates: {
                      top_hits: {
                        size: 1, // Retrieve only the top hit for each bucket
                        _source: ['georeferences.coordinates'], // Include only the specified field in the result
                        sort: [
                          {
                            date: {
                              order: 'desc',  // Sort by date field in descending order
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Extract the top location buckets from the Elasticsearch response
      const topLocationsBuckets = response.aggregations.top_locations.locations.buckets; 

      // Return the array of top location buckets
      return topLocationsBuckets;


    } catch (error) {
      console.error(error);
    }
  }
  

  /**
 * Retrieves the document distribution over time using a date histogram aggregation from Elasticsearch.
 * @returns {Array} An array of buckets representing the document distribution over time.
 */
  async function getDocumentDistributionOverTime() {
    try {
      // Execute an Elasticsearch search query
      const response = await esClient.search({
        index: indexName, 
        body: {
          size: 0, // Return only aggregations, not search results
          aggs: {
            documents_over_time: {
              date_histogram: {
                field: 'date', // Field for date histogram aggregation
                fixed_interval: '1d',  // Interval for the date histogram (1 day)
                format: 'yyyy-MM-dd', // Date format for the histogram buckets
                // min_doc_count: 0, // Include buckets with zero document count
              },
            },
          },
        },
      });
      // Extract the document distribution over time buckets from the Elasticsearch response
      const documentDistributionOverTime = response.aggregations.documents_over_time.buckets;
      
      // Return the array of document distribution over time buckets
      return documentDistributionOverTime;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  
  
/**
 * Handles a request to generate and render a dashboard with data obtained from Elasticsearch.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
  const getDashboard = async (req, res) => {
    try {
      // Fetch top 10 mentioned locations and document distribution over time asynchronously
      const topGeoreferences = await getTop10MentionedLocations();
      const documentsOverTime = await getDocumentDistributionOverTime();
      
      // Render the dashboard with the obtained data
      res.render('dashboard', {
        topGeoreferences,
        documentsOverTime,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
  
  /**
 * Handles a request to retrieve data from Elasticsearch based on geo-distance criteria.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
  const getCoordinates = async (req, res) => {
    try {
      // Extract coordinates from the request body
      const { coordinates } = req.body;
      console.log(coordinates)

      // Perform Elasticsearch query
      const result = await esClient.search({
        index: indexName,
        body: {
          query: {
            nested: {
              path: 'georeferences', // Nested path for georeferences
              query: {
                bool: {
                  must: [
                    {
                      geo_distance: {
                        distance: '1000km', // Geo-distance threshold
                        'georeferences.coordinates': {
                          lat: coordinates.lat, // Latitude from the request body
                          lon: coordinates.lng,// Longitude from the request body
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      });
  
    // Extract hits from the Elasticsearch result
    const hits = result.hits.hits.map(hit => hit._source);
    // Send a JSON response with the extracted hits
    res.json({hits})
    
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };


module.exports={getDashboard,getCoordinates};