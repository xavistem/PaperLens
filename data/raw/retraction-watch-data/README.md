# Retraction Watch Data

This repository contains the latest dataset from Retraction Watch, generated on 2025-06-06.

Research can be modified after publication, including being corrected or retracted. This is a natural part of the research process and important for accurately reporting changes. While members can deliver this information to us, Retraction Watch has also collected a large number of retractions. Many of these have not been reported by our members.

In September 2023, Crossref acquired the Retraction Watch database from the Center of Scientific Integrity and have made it publicly available. The database contains retractions gathered from publisher websites and is updated every working day by Retraction Watch. Some other update types, such as expressions of concern and corrections, are also included in the data, but these are not as comprehensive as retractions. Various methods are used to find retractions, including searching scholarly databases, checking publisher websites, web searches, and reports from the community. For further details, see [this document](https://retractionwatch.com/wp-content/uploads/2023/12/Building-The-Database.pdf).

Data in the csv file is comma-separated, with lists in a single entry separated by a semicolon (such as author names or reasons for retraction).

The column headings in the csv file are:

- _Record ID_: An internal identifier from Retraction Watch.
- _Title_: The title of the retracted or updated content.
- _Subject_: The subject area of the publication.
- _Institution_: Author affiliations, as given in the content.
- _Journal_: The source (serial, book, etc.) in which the research was published.
- _Publisher_: The organisation responsible for publication.
- _Country_: Countries included in author affiliations.
- _Author_: A list of author names.
- _URLS_: Links to relevant pages on the Retraction Watch website, including blog posts about the retraction.
- _ArticleType_: The content type, using a [list of types](https://retractionwatch.com/retraction-watch-database-user-guide/retraction-watch-database-user-guide-appendix-c-article-types/) maintained by Retraction Watch. Note that this isn’t the same as the Crossref work type.
- _RetractionDate_: The date of the published retraction.
- _RetractionDOI_: The DOI of the published retraction, if available. If there is no DOI, the value is either blank, 'unavailable', or 'Unavailable'.
- _RetractionPubMedID_: PubMED ID of the published retraction, if available. If there is no Pubmed ID, the value is either blank or 0.
- _OriginalPaperDate_: The publication date of the retracted content.
- _OriginalPaperDOI_: The DOI of the retracted publication, if available. If there is no DOI, the value is either blank, 'unavailable', or 'Unavailable'.
- _OriginalPaperPubMedID_: PubMED ID of the original publication, if available. If there is no Pubmed ID, the value is either blank or 0.
- _RetractionNature_: The type of update notice, which can be Retraction, Correction, Expression of concern, or Reinstatement. Note that these are different to the [list of update types](/crossmark/participating-in-crossmark/#00279) in the Crossref schema.
- _Reason_: A list of reasons for retraction. This uses a [controlled vocabulary](https://retractionwatch.com/retraction-watch-database-user-guide/retraction-watch-database-user-guide-appendix-b-reasons/) maintained by Retraction Watch.
- _Paywalled_: Is a fee or paid subscription required to access the retraction notice? Note that there can be cases where this changes some time after publication of the notice.
- _Notes_: Additional comments about the retraction.

These fields are also documented [on the Retraction Watch website](https://retractionwatch.com/retraction-watch-database-user-guide/retraction-watch-database-user-guide-appendix-a-fields/).  Changes to the field names and vocabulary used [are recorded by Retraction Watch](https://retractionwatch.com/retraction-watch-database-user-guide/retraction-watch-database-user-guide-appendix-d-changes/).