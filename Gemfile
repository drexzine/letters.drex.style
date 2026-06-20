source "https://rubygems.org"

# GitHub Pages — pins Jekyll + all whitelisted plugins to the exact
# versions GitHub Pages builds with, so local == production.
gem "github-pages", group: :jekyll_plugins

# Plugins (also declared in _config.yml). github-pages includes these,
# but listing them keeps the intent explicit + local builds happy.
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Windows / JRuby tzinfo support (harmless elsewhere).
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Faster file watching on Windows.
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Ruby 3.4+ no longer ships these as default gems.
gem "csv"
gem "base64"
gem "logger"
