# Elastic-Search

## Repo description:
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

## Data used:
- The indexed data are collected from `Ruters collection`:
```
  Reuters-21578 text categorization test collection
                        Distribution 1.0
                       README file (v 1.2)
                        26 September 1997

                         David D. Lewis
                      AT&T Labs - Research     
                     lewis@research.att.com

```
- The total number of JSON objects that can be extracted is approximately `20000` objects, __but I only inserted `9387` documents__.
  
- It has the following `Document-Internal Tags`:
  
```txt
  Just as the <REUTERS> and </REUTERS> tags serve to delimit
documents within a file, other tags are used to delimit elements
within a document.  We discuss these in the order in which they
typically appear, though the exact order should not be relied upon in
processing. In some cases, additional tags occur within an element
delimited by these top level document-internal tags.  These are
discussed in this section as well.

     We specify below whether each open/close tag pair is used exactly
once (ONCE) per a story, or a variable (VARIABLE) number of times
(possibly zero).  In many cases the start tag of a pair appears only
at the beginning of a line, with the corresponding end tag always
appearing at the end of the same line.  When this is the case, we
indicate it with the notation "SAMELINE" below, as an aid to those
processing the files without SGML tools.  

     1. <DATE>, </DATE> [ONCE, SAMELINE]: Encloses the date and time
of the document, possibly followed by some non-date noise material.

     2. <MKNOTE>, </MKNOTE> [VARIABLE] : Notes on certain hand
corrections that were done to the original Reuters corpus by Steve
Finch.

     3. <TOPICS>, </TOPICS> [ONCE, SAMELINE]: Encloses the list of
TOPICS categories, if any, for the document. If TOPICS categories are
present, each will be delimited by the tags <D> and </D>.
     
     4. <PLACES>, </PLACES> [ONCE, SAMELINE]: Same as <TOPICS>
but for PLACES categories.

     5. <PEOPLE>, </PEOPLE> [ONCE, SAMELINE]: Same as <TOPICS>
but for PEOPLE categories.

     6. <ORGS>, </ORGS> [ONCE, SAMELINE]: Same as <TOPICS> but
for ORGS categories.

     7. <EXCHANGES>, </EXCHANGES> [ONCE, SAMELINE]: Same as
<TOPICS> but for EXCHANGES categories.

     8. <COMPANIES>, </COMPANIES> [ONCE, SAMELINE]: These tags always
appear adjacent to each other, since there are no COMPANIES categories
assigned in the collection.
    
     9. <UNKNOWN>, </UNKNOWN> [VARIABLE]: These tags bracket control
characters and other noisy and/or somewhat mysterious material in the
Reuters stories.

     10. <TEXT>, </TEXT> [ONCE]: We have attempted to delimit all the
textual material of each story between a pair of these tags.  Some
control characters and other "junk" material may also be included.
The whitespace structure of the text has been preserved. The <TEXT>
tag has the following attribute:

        a. TYPE: This has one of three values: NORM, BRIEF, and
UNPROC.  NORM is the default value and indicates that the text of the
story had a normal structure. In this case the TEXT tag appears simply
as <TEXT>.  The tag appears as <TEXT TYPE="BRIEF"> when the story is a
short one or two line note.  The tags appears as <TEXT TYPE="UNPROC">
when the format of the story is unusual in some fashion that limited
our ability to further structure it.

The following tags optionally delimit elements inside the TEXT
element. Not all stories will have these tags:

        a. <AUTHOR>, </AUTHOR> : Author of the story. 
        b. <DATELINE>, </DATELINE> : Location the story
originated from, and day of the year. 
        c. <TITLE>, </TITLE> : Title of the story. We have attempted
to capture the text of stories with TYPE="BRIEF" within a <TITLE>
element.
        d. <BODY>, </BODY> : The main text of the story.
```
- Data are extracted from Reuters sgm files using [Beautiful Soup](https://pypi.org/project/beautifulsoup4/)
  
- Temporal expressions and geo-points are extracted using third parties:
   * [Spacy](https://spacy.io/)
   * [Geopy](https://geopy.readthedocs.io/en/stable/)
 

## Files Structure:
- backend
  - controllers (handle the functionalities of the search and dashboard)
      - dashboard.js
      - home.js
      - search.js
  - routs (handles the routes)
      - index.js
  - views (handles the front using `ejs`)
      - dashboard.ejs
      - home.ejs
  - server.js (main server, `node js`)
- cache
  - geopoint.csv (saved extracted geopoints)
  - last_parsed_info.txt (to track the last file and line parsed)
  - reuters_info.json (extracted all JSON data objects)
  - reuters_info_number.json ( prtial extracted JSON data objects0
- data (contains sgm reuters files)
- index-creation-data-insertion.ipynb (Handle index creation and  data insertion)
