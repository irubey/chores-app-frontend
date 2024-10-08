"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaMoneyBillWave,
  FaComments,
  FaClipboardList,
  FaCalendarAlt,
} from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/common/LoadingSpinner";

function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();

  useEffect(() => {
    if (status === "succeeded" && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [status, isAuthenticated, router]);

  // Display spinner when initialization is pending or loading
  if (status === "idle" || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-text-primary font-sans">
      {/* Landing Page Content */}
      <main>
        {/* Welcome Section */}
        <section className="container mx-auto py-20 px-4 text-center">
          <h1 className="text-4xl md:text-5xl mb-6 font-serif text-primary-dark">
            Welcome to roomies
          </h1>
          <p className="text-xl mb-8 text-text-secondary">
            The ultimate household management app for seamless collaboration and
            harmonious living.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login" className="btn btn-primary px-6 py-3 text-lg">
              Login
            </Link>
            <Link href="/register" className="btn btn-accent px-6 py-3 text-lg">
              Get Started
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Messaging Forum */}
            <div className="card bg-white dark:bg-neutral-dark p-6 rounded-lg shadow-md">
              <h3 className="text-2xl mb-4 font-serif text-primary flex items-center">
                <FaComments className="mr-2 text-accent" />
                Messaging Forum
              </h3>
              <p className="text-body text-text-secondary">
                Engage in real-time conversations with threaded discussions.
                Share files and stay organized with our tailored household
                communication platform.
              </p>
            </div>

            {/* Chores Management */}
            <div className="card bg-white dark:bg-neutral-dark p-6 rounded-lg shadow-md">
              <h3 className="text-2xl mb-4 font-serif text-primary flex items-center">
                <FaClipboardList className="mr-2 text-accent" />
                Chores Management
              </h3>
              <p className="text-body text-text-secondary">
                Create and assign chores with detailed checklists. Set due
                dates, track progress, and receive reminders to keep your
                household running smoothly.
              </p>
            </div>

            {/* Shared Calendar */}
            <div className="card bg-white dark:bg-neutral-dark p-6 rounded-lg shadow-md">
              <h3 className="text-2xl mb-4 font-serif text-primary flex items-center">
                <FaCalendarAlt className="mr-2 text-accent" />
                Shared Calendar
              </h3>
              <p className="text-body text-text-secondary">
                Coordinate schedules, manage events collaboratively, and sync
                with personal calendars to ensure everyone is on the same page.
              </p>
            </div>

            {/* Finances Management */}
            <div className="card bg-white dark:bg-neutral-dark p-6 rounded-lg shadow-md">
              <h3 className="text-2xl mb-4 font-serif text-primary flex items-center">
                <FaMoneyBillWave className="mr-2 text-accent" />
                Finances Management
              </h3>
              <p className="text-body text-text-secondary">
                Track expenses, manage debts, and handle transactions with ease.
                Our app helps you stay on top of your finances and make informed
                decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="container mx-auto py-16 px-4 text-center">
          <h2 className="text-3xl md:text-4xl mb-6 font-serif text-primary-dark">
            Join Roomies Today!
          </h2>
          <p className="text-xl mb-8 text-text-secondary">
            Simplify your household management and enjoy a harmonious living
            experience with your roommates.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/login" className="btn btn-primary px-6 py-3 text-lg">
              Login
            </Link>
            <Link href="/register" className="btn btn-accent px-6 py-3 text-lg">
              Get Started
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
