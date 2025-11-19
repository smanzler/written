import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Icon } from "@iconify/react";

const QUOTES = [
  {
    text: "Very impressed by @written. It's such a great way to write.",
    author: "@simonmanzler",
    url: "https://simonmanzler.com",
    image: "https://github.com/shadcn.png",
  },
  {
    text: "@written has completely changed the way I organize my thoughts.",
    author: "@simonmanzler",
    url: "https://simonmanzler.com",
    image: "https://github.com/shadcn.png",
  },
  {
    text: "I've never enjoyed writing as much as I do with @written!",
    author: "@simonmanzler",
    url: "https://simonmanzler.com",
    image: "https://github.com/shadcn.png",
  },
  {
    text: "@written makes writing so effortless and enjoyable.",
    author: "@simonmanzler",
    url: "https://simonmanzler.com",
    image: "https://github.com/shadcn.png",
  },
  {
    text: "Every writer should give @written a try—it's truly remarkable.",
    author: "@simonmanzler",
    url: "https://simonmanzler.com",
    image: "https://github.com/shadcn.png",
  },
];

const getRandomQuote = () => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};

export default function Quote() {
  const { text, author, url, image } = getRandomQuote();

  return (
    <div className="bg-muted hidden xl:flex items-center justify-center">
      <div className="relative flex flex-col gap-6 max-w-2xs">
        <div className="absolute select-none -top-11 -left-7 z-1">
          <Icon
            icon="si:quote-fill"
            className="text-muted-foreground/20 size-16 rotate-180"
          />
        </div>
        <blockquote className="z-10 text-xl">
          {typeof text === "string"
            ? text.split(/(@written)/g).map((part, i) =>
                part === "@written" ? (
                  <Link to="/" key={i} className="group font-bold">
                    <span>@</span>
                    <strong className="group-hover:underline">written</strong>
                  </Link>
                ) : (
                  part
                )
              )
            : text}
        </blockquote>
        <Link
          to={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4"
        >
          <Avatar className="size-12">
            <AvatarImage src={image} />
            <AvatarFallback className="bg-background">
              {author.slice(1, 2)}
            </AvatarFallback>
          </Avatar>
          <cite className="not-italic font-medium text-foreground-light whitespace-nowrap">
            {author}
          </cite>
        </Link>
      </div>
    </div>
  );
}
