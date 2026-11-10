"""Compatibility launcher for JusticeFlow Flask app."""

from app import app


def main():
    app.run(debug=True)


if __name__ == "__main__":
    main()

