#!/usr/bin/env ruby
# frozen_string_literal: true
#
# check-email-feed.rb — ADVISORY pre-flight lint for the Kit email feed.
#
# Right-sized for the draft-only workflow: Kit's "Send automatically = OFF" means a
# human reviews every draft before it sends, so this NEVER blocks anything. It just
# prints things worth a glance before you go review the draft in Kit — especially the
# stuff you can't see in a quick preview (missing alt, relative URLs, clip size).
#
# Run:  bundle exec ruby scripts/check-email-feed.rb   (reads _site/email-feed.xml)
# Always exits 0. Not wired to any hook or CI — it's a convenience, not a gate.

require 'nokogiri'

SITE = 'https://letters.drex.style'
FEED = ENV.fetch('EMAIL_FEED_PATH', File.join(File.expand_path('..', __dir__), '_site', 'email-feed.xml'))
CLIP_BYTES = 100 * 1024 # ~Gmail's 102KB clip

warns = []

unless File.exist?(FEED)
  puts "email-feed: not built yet — run `bundle exec jekyll build` first (#{FEED})."
  exit 0
end

doc = Nokogiri::XML(File.read(FEED))
warns << "the feed isn't well-formed XML, so Kit may fail to read it: #{doc.errors.first}" if doc.errors.any?

items = doc.xpath('/rss/channel/item')
warns << "#{items.size} letters are in the feed — Kit will draft one email per letter. Expecting just 1?" if items.size > 1

items.each do |item|
  title = item.at_xpath('title')&.text.to_s.strip
  label = title.empty? ? 'a letter' : %("#{title}")
  body  = item.at_xpath('content:encoded', 'content' => 'http://purl.org/rss/1.0/modules/content/')&.text.to_s
  frag  = Nokogiri::HTML.fragment(body)

  frag.css('[src], [href]').each do |el|
    %w[src href].each do |attr|
      v = el[attr].to_s
      warns << "#{label}: relative URL #{v.inspect} — images/links can break in email (should be absolute https)" if v =~ %r{\A/(?!/)}
    end
  end
  frag.css('img').each { |img| warns << "#{label}: an image is missing alt text" if img['alt'].to_s.strip.empty? }
  warns << "#{label}: contains <script>/<iframe> — Kit strips these, but it's unexpected in a letter" if body =~ /<(?:script|iframe)\b/i

  kb = (body.bytesize / 1024.0).round
  warns << "#{label}: email body is ~#{kb}KB — near Gmail's ~102KB clip; consider a <!--more--> break" if body.bytesize > CLIP_BYTES
end

if warns.empty?
  puts "email-feed: ✓ #{items.size} letter(s) in the feed, nothing worth flagging."
else
  puts "email-feed: #{warns.size} thing(s) worth a glance (advisory only — nothing is blocked):"
  warns.each { |w| puts "  • #{w}" }
  puts "\nThese won't stop you. Kit drafts only; you review + Send. Fix anything that matters, or ignore."
end
exit 0
