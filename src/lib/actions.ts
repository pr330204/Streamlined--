
"use server";

import { suggestMovie, SuggestMovieInput } from "@/ai/flows/suggest-movie-from-prompt";
import { checkAndSaveMovieLink, CheckAndSaveMovieLinkInput } from "@/ai/flows/check-and-save-movie-link";
import { z } from "zod";
import fetch from "node-fetch";

const suggestMovieSchema = z.object({
  prompt: z.string().min(10, "Please provide a more detailed description."),
});

export async function suggestMovieAction(values: SuggestMovieInput) {
  const validated = suggestMovieSchema.safeParse(values);
  if (!validated.success) {
    return {
      success: false,
      message: validated.error.errors[0].message,
    };
  }
  try {
    const result = await suggestMovie(validated.data);
    return {
      success: true,
      movieTitle: result.movieTitle,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "AI failed to suggest a movie. Please try again.",
    };
  }
}


const addMovieSchema = z.object({
    movieTitle: z.string().min(1, "Movie title is required."),
    movieLink: z.string().url("Please enter a valid URL."),
});

export async function checkMovieLinkAction(values: CheckAndSaveMovieLinkInput) {
    const validated = addMovieSchema.safeParse(values);
    if (!validated.success) {
        return {
            success: false,
            message: validated.error.errors[0].message,
        };
    }

    try {
        const result = await checkAndSaveMovieLink(validated.data);
        if (result.isValid) {
            return {
                success: true,
                message: result.message,
            };
        } else {
            return {
                success: false,
                message: result.message || "The provided link is not valid.",
            };
        }
    } catch (error) {
        console.error(error);
        return {
            success: false,
            message: "An error occurred while validating the movie link.",
        };
    }
}
