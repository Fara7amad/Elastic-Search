# Elastic-Search

This Repo aims to show how to construct a basic search engine using ElasticSerch that has the following requirements:
1. Building an index that has the following properties:
    ```json
        "properties": {
            "date": {"type": "date"},
            "author": {"type": "text"},
            "title": {
                 "type" : "text",
                 "analyzer":"autocomplete"
            },
            
            "body": {
                "type": "text",
                "analyzer": "custom_analyzer"
                },
            "temporal_expressions": {
                "type": "nested",
                "properties": {
                    "text": {"type": "text"},
                    "label": {"type": "text"},
                }
            },
            "georeferences": {
                "type": "nested",
                "properties": {
                    "location": {"type": "keyword"},
                    "coordinates": {"type": "geo_point"},
                }
            },
            "geopoint_author": {
                "type": "nested",
                "properties": {
                    "location": {"type": "text"},
                    "coordinates": {"type": "geo_point"},
                }
            },
            
        }
    

    ```
2. A smart query processing and analytics engine that can answer spatio-temporal queries and provide related analytics. The query from the user is represented as a tuple `(query, temporal expression, georeference)`.
   
   - Providing an autocomplete service to return a list of top-10 documents based on their titles. The system should start suggesting titles after the 3rd typed character. Taking into consideration that the user might write some misspelled words.
   - Retrieving relevant documents by considering both title and content, with greater emphasis on the title. Also, considering the recency and localization factors while ranking the results.

3. A dashboard that has 3 functionalities:
     1. Return the top-10 mentioned georeferences across the entire index.
     2. Return the distribution of documents over time, with a time aggregation of 1 day.
     3. Return documents for specific coordinates within a threshold of 1000km.
