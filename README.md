# ChoresApp Frontend

ChoresApp is a web application designed to simplify household chore management and collaboration. This README focuses on the frontend part of the project.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Chart.js
- Axios

## Getting Started

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev # or yarn dev
``` 

5. Open your browser and navigate to `http://localhost:3000` to access the app.

## Project Structure

- `src/`: Contains the main source code
  - `app/`: Next.js app directory
  - `components/`: Reusable React components
  - `contexts/`: React context providers
  - `hooks/`: Custom React hooks
  - `styles/`: Global styles and Tailwind CSS configuration
  - `utils/`: Utility functions and API calls

## Key Features

- User authentication
- Dashboard with chore distribution charts and upcoming chores
- Household management
- Chore creation and assignment
- User preferences
- Notifications

## Deployment

The project is set up for deployment on Vercel. The `build-and-test-ci.yml` file in the `.github/workflows/` directory handles the CI/CD pipeline.

## Environment Variables

Make sure to set the following environment variables:

- `NEXT_PUBLIC_API_BASE_URL`: The base URL for your backend API
- `NEXT_PUBLIC_DEV_MODE`: Set to 'true' for development mode

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)


## License

[MIT License](LICENSE)
