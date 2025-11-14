# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-11-13 21:24:48 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

* Build a comprehensive web platform for finding and comparing car import companies from USA to Georgia

## Key Features

* Homepage with service introduction, hero section, and key benefits
* Advanced company search with filters (geography, services, price, rating, VIP status)
* Company catalog with grid layout, sorting, and search functionality
* Detailed company profiles with services, reviews, contact information
* User dashboard for managing searches, favorites, and import tracking
* Fully responsive design optimized for mobile and desktop
* Accessibility features following WCAG guidelines
* Nielsen's 10 UX heuristics implementation for optimal user experience

## Overall Architecture

* Frontend: React + TypeScript + Vite
* UI: shadcn/ui component library with Tailwind CSS
* Routing: React Router
* Data: Mock data with faker.js (ready for API integration)
* Theme: Custom green (#0BDA51) and orange (#FFA500) color scheme
* Typography: Noto Sans Georgian font

* [2025-11-14 12:41:18] - New feature: Implemented complete car import platform with search, catalog, profiles, and UX heuristics