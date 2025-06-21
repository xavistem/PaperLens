<div align="center">
<img src="https://github.com/user-attachments/assets/0e4e0df2-9c7c-4e0c-8be8-857053bf735b" width="200" height="200" />
<h1>PaperLens: AI-Powered Retraction Risk Analysis</h1>
<p>
<i>A machine learning tool to assess the integrity and predict the retraction risk of scientific papers before you read or cite them.</i>
</p>
</div>
<p align="center">
<a href="#-business-context">Business Context</a> •
<a href="#-project-overview-methodology">Project Overview</a> •
<a href="#-features-user-modes">Features</a> •
<a href="#-tech-stack-architecture">Tech Stack & Architecture</a> •
<a href="#-live-demo">Live Demo</a> •
<a href="#-project-structure">Project Structure</a>
</p>
🔬 Business Context
The world of scientific publishing faces a crisis of trust. Every year, thousands of papers are retracted due to errors, misconduct, or outright fraud. This "retraction debt" wastes researchers' time, misleads journalists, and erodes public confidence in science.
How can we identify high-risk papers before they cause damage?
PaperLens was born from this challenge. It's a data-driven tool designed to provide an instantaneous risk assessment for any scientific paper with a DOI. Our goal is to empower researchers, editors, and science communicators to navigate the vast scientific literature with greater confidence.
[!SUCCESS]
Mission: To enhance scientific integrity by making retraction risk transparent and quantifiable.

<details>
<summary>🎯 <strong>Project Overview & Methodology</strong></summary>

This project implements an end-to-end machine learning pipeline to predict the probability of a paper being retracted. The core methodology is built on a case-control study design.

*   **Case Group Construction:** We started with a dataset of ~55,000 confirmed retracted articles from the Retraction Watch Database.
*   **Data Enrichment:** Each paper's metadata was enriched using the OpenAlex API to obtain over 20 structured features related to authorship, publication venue, content, and impact.
*   **Control Group Sampling:** To train a robust model, we created a matched control group. For each retracted paper, we found a "non-retracted twin" using a hierarchical cascade, primarily matching on `source_id` (the unique journal/conference), `year`, and `article_type`. This forces the model to learn subtle integrity signals, not just obvious contextual biases.
*   **Modeling:** We trained and optimized a gradient boosting model (**XGBoost**) on the combined dataset of ~103,000 papers. The final model achieved a **ROC AUC of 0.741**, showing a decent ability to distinguish between high-risk and low-risk publications. The most predictive features were found to be metadata integrity flags like `is_publisher_missing` and `is_abstract_missing`.

</details>

<details>
<summary>✨ <strong>Features & User Modes</strong></summary>

PaperLens provides a tailored experience for different user needs, all powered by the same core risk model.

*   **Instant Risk Score:** Enter a paper's DOI and receive a retraction risk probability score (0-100).
*   **Explainable AI (XAI) Flags:** The app highlights the key metadata factors influencing the prediction (e.g., "Warning: Publisher information is missing.").
*   **User-Centric Modes:**
    *   **Researcher Mode:** "Assess the structural integrity of a paper before you cite or submit." Provides a detailed breakdown and a pre-submission/pre-citation checklist.
    *   **Journalist Mode:** "Fact-check the stability of a new scientific claim." Offers a clear stoplight system (Green/Yellow/Red) and reporting guidance.
    *   **General User Mode:** "Understand any scientific paper, simply." Delivers a simplified risk assessment and aims to provide plain-language summaries of the paper's abstract.
    *   **Journal Editor Mode:** "Get an initial, automated integrity check on new submissions." Presents a triage-focused report with actionable flags for extra scrutiny.

</details>

<details>
<summary>🛠️ <strong>Tech Stack & Architecture</strong></summary>

The project is built with a modern, decoupled architecture to ensure scalability and maintainability.

*   **Data Science & Modeling:** Python, Pandas, Jupyter, Scikit-learn, XGBoost.
*   **Data Sources:** OpenAlex API, Retraction Watch Database.
*   **Backend (Inference API):** A lightweight **Flask** or **FastAPI** server in Python.
    *   Loads the `paperlens_xgb_pipeline.pkl` model.
    *   Exposes a `/predict` endpoint that receives paper metadata, runs it through the pipeline, and returns a JSON response with the risk score.
*   **Frontend (Web Application):** A modern web application built with **React** and **TypeScript**.
    *   Handles user input (DOI).
    *   Fetches metadata from the OpenAlex API.
    *   Sends the metadata to our backend API for analysis.
    *   Receives the risk score and displays it in a dynamic, user-friendly interface.

</details>

🚀 Live Demo
[Link to be added] - Explore the PaperLens prototype and analyze a paper yourself!
👉 Launch the PaperLens App

[!IMPORTANT]
This is a functional prototype developed for a Data Analytics Bootcamp. The model is trained on historical data and is intended for educational and demonstrative purposes.

<details>
<summary>📂 <strong>Project Structure</strong></summary>
The repository is organized to separate concerns, from data science notebooks to the final web application.

```
paperlens/
├── backend/                # Backend API (Flask/FastAPI)
│   ├── app.py              # Main server application
│   └── requirements.txt    # Python dependencies
├── webapp/                 # Frontend Application (React)
│   ├── src/
│   └── package.json        # Node.js dependencies
├── models/
│   └── paperlens_xgb_pipeline.pkl  # The final, trained model pipeline
├── data/
│   ├── raw/
│   └── processed/
├── notebooks/
│   ├── 01_Data_Acquisition_and_Preparation.ipynb
│   └── 02_Analysis_and_Modeling.ipynb
├── src/
│   └── feature_extractor.py
└── README.md
```
</details>

<details>
<summary>👨‍💻 <strong>Author</strong></summary>

[![GitHub](https://img.shields.io/badge/@xavistem-GitHub-181717?logo=github&style=flat-square)](https://github.com/xavistem)
[![LinkedIn](https://img.shields.io/badge/@xavifernandez-LinkedIn-0077B5?logo=linkedin&style=flat-square)](https://www.linkedin.com/in/xavifernandeztorras/)
</details>

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![Jupyter](https://img.shields.io/badge/Jupyter-Analysis-orange?logo=jupyter)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-ML-orange?style=flat-square&logo=scikit-learn)
![XGBoost](https://img.shields.io/badge/XGBoost-Modeling-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-WebApp-blue?logo=react)
![Flask](https://img.shields.io/badge/Flask-API-grey?logo=flask)
![Status](https://img.shields.io/badge/Status-In%20Progress-blue)
