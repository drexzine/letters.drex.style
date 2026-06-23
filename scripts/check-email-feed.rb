#!/usr/bin/env ruby
# frozen_string_literal: true
#
# check-email-feed.rb — SAFETY VALIDATOR for the Kit email feed.
# See PLAN.md (Track 0 + Track C) and FOR-CHIELO.md. Run via: bundle exec ruby ...
#
# Two jobs against the BUILT feed (_site/email-feed.xml):
#
#   1. STRUCTURE + EMAIL-SAFETY (always BLOCK on violation):
#      - the file is a well-formed RSS feed (root <rss> + <channel>), not an error page;
#      - each item has title/link/guid/content; guid + link are absolute on our domain;
#      - the body is gated by a STRUCTURAL ALLOWLIST: only known-safe tags; no inline
#        event handlers; every URL absolute https:// (no relative/protocol-relative/http
#        /javascript:/vbscript:); every <img> has real alt text;
#      - body over ~102KB is BLOCKED (Gmail clips it — add <!--more-->).
#
#   2. CHANGE TRIPWIRE (BLOCK until a human approves): compares emailable guids vs the
#      approved ledger (scripts/email-feed-manifest.txt). ANY change blocks until
#      `--bless`. Adding >1 letter at once (archive-blast) or a removal+addition (a
#      slug/date change that makes Kit RE-SEND) is DANGER and `--bless` REFUSES it
#      unless `--force` is also given. `--bless` always prints exactly what it approves.
#
# Exit 0 = safe. Nonzero = blocked. Defense-in-depth; the ultimate guarantee is still
# Kit (Single mode, auto-send OFF — nothing emails without a human pressing Send).

require 'nokogiri'
require 'set'

SITE = 'https://letters.drex.style'
ROOT = File.expand_path('..', __dir__)
DEFAULT_FEED = File.join(ROOT, '_site', 'email-feed.xml')
# Paths are env-overridable ONLY for testing against fixtures.
FEED     = ENV.fetch('EMAIL_FEED_PATH', DEFAULT_FEED)
MANIFEST = ENV.fetch('EMAIL_FEED_MANIFEST', File.join(__dir__, 'email-feed-manifest.txt'))
USING_DEFAULTS = !ENV.key?('EMAIL_FEED_PATH') && !ENV.key?('EMAIL_FEED_MANIFEST')
CONTENT_NS = { 'content' => 'http://purl.org/rss/1.0/modules/content/' }.freeze
CLIP_WARN_BYTES  = 97 * 1024
CLIP_BLOCK_BYTES = 102 * 1024 # Gmail clips a single email's HTML around here

# Email-safe HTML the body is allowed to contain. Anything else BLOCKS — EXCEPT a
# trusted decorative <svg> subtree (our cutline/m-mark furniture; inert in email),
# which is permitted wholesale but still has DENY_TAGS + on*/URL checks applied inside.
SAFE_TAGS = %w[
  a abbr address aside b blockquote br caption cite code col colgroup dd del dfn div
  dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img ins kbd li mark ol p pre q s
  samp section small span strong sub sup table tbody td tfoot th thead time tr u ul var wbr
].to_set.freeze
# Always blocked, anywhere — even inside an <svg> subtree.
DENY_TAGS = %w[
  script style iframe object embed form input textarea select button link meta base
  foreignobject math audio video canvas noscript template frame frameset applet marquee
].to_set.freeze
URL_ATTRS = %w[href src srcset poster background action formaction longdesc].to_set.freeze

# classify a URL value found in the body
def classify_url(raw)
  v = raw.to_s.strip
  return :empty if v.empty?
  low = v.downcase
  return :danger      if low.start_with?('javascript:', 'vbscript:')
  return :data        if low.start_with?('data:')
  return :anchor      if v.start_with?('#')
  return :mailtel     if low.start_with?('mailto:', 'tel:')
  return :ours        if v.start_with?("#{SITE}/")
  return :foreign     if low.start_with?('https://')
  return :http        if low.start_with?('http://')
  return :proto_rel   if v.start_with?('//')
  :relative
end

bless = ARGV.include?('--bless')
force = ARGV.include?('--force')
errors   = []
warnings = []

unless File.exist?(FEED)
  warn "BLOCK feed not found: #{FEED}"
  warn '      run `bundle exec jekyll build` first.'
  exit 1
end

# --- parse strictly: a malformed feed BLOCKS, never crashes ---
raw = File.read(FEED)
doc = nil
begin
  doc = Nokogiri::XML(raw) { |cfg| cfg.strict.nonet }
rescue Nokogiri::XML::SyntaxError => e
  warn "BLOCK email-feed.xml is not well-formed XML: #{e.message}"
  exit 1
end

# --- it must actually BE an rss feed (catch error pages / mis-renders) ---
unless doc.root && doc.root.name == 'rss'
  warn "BLOCK feed root is <#{doc.root&.name}>, not <rss> — not a valid RSS feed."
  warn '      the build may have emitted an error page or wrong layout. Investigate.'
  exit 1
end
errors << 'feed has no <channel> element' if doc.at_xpath('/rss/channel').nil?

# --- freshness: don't trust/approve a stale _site build (default paths only) ---
if USING_DEFAULTS
  sources = Dir[File.join(ROOT, '_posts', '**', '*')].select { |f| File.file?(f) }
  sources += [File.join(ROOT, 'email-feed.xml'), File.join(ROOT, '_config.yml')].select { |f| File.exist?(f) }
  if sources.any? { |f| File.mtime(f) > File.mtime(FEED) }
    errors << 'stale build: _site/email-feed.xml is older than source files — run `bundle exec jekyll build` first.'
  end
end

guids = []

doc.xpath('/rss/channel/item').each_with_index do |item, i|
  title = item.at_xpath('title')&.text.to_s.strip
  guid  = item.at_xpath('guid')&.text.to_s.strip
  link  = item.at_xpath('link')&.text.to_s.strip
  label = title.empty? ? "item[#{i}]" : "item '#{title}'"

  errors << "#{label}: missing <title>"                       if title.empty?
  errors << "#{label}: missing <guid>"                        if guid.empty?
  errors << "#{label}: guid not absolute on #{SITE} (#{guid.inspect})" unless guid.start_with?("#{SITE}/")
  errors << "#{label}: <link> not absolute on #{SITE} (#{link.inspect})" unless link.start_with?("#{SITE}/")
  guids << guid unless guid.empty?

  # full inner content (CDATA-aware: include raw element children, not just text)
  cnode = item.at_xpath('content:encoded', CONTENT_NS)
  body = cnode ? cnode.children.map { |n| (n.cdata? || n.text?) ? n.content : n.to_xml }.join : ''
  if body.strip.empty?
    errors << "#{label}: empty <content:encoded>"
    next
  end

  frag = Nokogiri::HTML.fragment(body)

  # structural allowlist: only known-safe tags (trusted decorative <svg> subtree is
  # permitted, but DENY_TAGS + attribute checks still apply inside it)
  frag.css('*').each do |el|
    tag = el.name.downcase
    in_svg = tag == 'svg' || el.ancestors.any? { |a| a.name.downcase == 'svg' }
    if DENY_TAGS.include?(tag)
      errors << "#{label}: disallowed tag <#{tag}> in body"
    elsif !in_svg && !SAFE_TAGS.include?(tag)
      errors << "#{label}: disallowed tag <#{tag}> in body"
    end

    el.attribute_nodes.each do |attr|
      an = attr.name.downcase
      av = attr.value.to_s
      if an.start_with?('on')
        errors << "#{label}: inline event handler #{an}= in body"
      elsif an == 'style'
        errors << "#{label}: dangerous CSS in style= (#{av[0, 40]})" if av =~ /javascript:|expression\s*\(|@import|behavior\s*:/i
        av.scan(/url\(\s*['"]?([^'")]+)/i).flatten.each do |u|
          case classify_url(u)
          when :danger then errors << "#{label}: javascript/vbscript url() in style="
          when :http, :proto_rel, :relative then errors << "#{label}: non-absolute url() in style= (#{u})"
          end
        end
      elsif URL_ATTRS.include?(an)
        vals = an == 'srcset' ? av.split(',').map { |s| s.strip.split(/\s+/).first } : [av]
        vals.each do |u|
          case classify_url(u)
          when :danger    then errors << "#{label}: javascript/vbscript URL in #{an}="
          when :http      then errors << "#{label}: http:// URL in #{an}= (must be https) — #{u}"
          when :proto_rel then errors << "#{label}: protocol-relative URL in #{an}= (//…) — #{u}"
          when :relative  then errors << "#{label}: relative URL in #{an}= (#{u}) — must be absolute https"
          when :data
            (%w[href action formaction].include?(an) ? errors : warnings) << "#{label}: data: URI in #{an}="
          when :foreign
            warnings << "#{label}: off-domain host in #{an}= (#{u}) — third-party/tracking?" if %w[src srcset poster background].include?(an)
          end
        end
      end
    end
  end

  # every image needs meaningful alt (treat nbsp/whitespace as empty)
  frag.css('img').each do |img|
    alt = img['alt'].to_s.gsub(/[[:space:] ]+/, ' ').strip
    errors << "#{label}: <img> missing alt text (src=#{img['src'].inspect})" if alt.empty?
  end

  # Gmail clip: block over the limit, warn approaching it
  kb = (body.bytesize / 1024.0).round(1)
  if body.bytesize > CLIP_BLOCK_BYTES
    errors   << "#{label}: body is #{kb}KB — over Gmail's ~102KB clip. Add a <!--more--> break."
  elsif body.bytesize > CLIP_WARN_BYTES
    warnings << "#{label}: body is #{kb}KB — approaching Gmail's ~102KB clip; consider <!--more-->."
  end
end

dupes = guids.group_by(&:itself).select { |_, v| v.size > 1 }.keys
errors << "duplicate guids in feed: #{dupes.join(', ')}" unless dupes.empty?

# --- change tripwire vs the approved ledger (BOM-tolerant read) ---
approved = if File.exist?(MANIFEST)
             File.read(MANIFEST, mode: 'r:bom|utf-8').lines.map(&:strip).reject { |l| l.empty? || l.start_with?('#') }
           else
             []
           end
current = guids.sort.uniq
added   = current - approved
removed = approved - current

# DANGER classification shared by check + bless
danger = []
danger << "#{added.size} NEW letters would go out at once (archive-blast)" if added.size > 1
danger << "#{removed.size} removed AND #{added.size} added — a changed permalink would make Kit RE-SEND" if !removed.empty? && !added.empty?

if bless
  if errors.any?
    warn "Refusing to --bless: fix the #{errors.size} blocking issue(s) first.\n"
    errors.each { |e| warn "BLOCK #{e}" }
    exit 1
  end
  warn "About to approve:  +#{added.size} #{added.inspect}   -#{removed.size} #{removed.inspect}"
  if danger.any? && !force
    danger.each { |d| warn "BLOCK DANGER: #{d}" }
    warn "\nRefusing to --bless a DANGER change without --force. Investigate; if truly intended,"
    warn "re-run: bundle exec ruby scripts/check-email-feed.rb --bless --force"
    exit 1
  end
  danger.each { |d| warn "WARN  DANGER OVERRIDDEN (--force): #{d}" } if danger.any?
  header = "# Approved emailable letters (guids) for the Kit email feed.\n" \
           "# Managed by scripts/check-email-feed.rb --bless. Commit changes here\n" \
           "# deliberately — each line is a letter approved to go out via Kit.\n"
  File.write(MANIFEST, header + current.join("\n") + (current.empty? ? '' : "\n"))
  puts "BLESSED #{current.size} approved letter(s). Review + commit #{File.basename(MANIFEST)}."
  exit 0
end

unless added.empty? && removed.empty?
  danger.each { |d| errors << "DANGER: #{d}." }
  errors << "EMAILABLE SET CHANGED vs the ledger — added: #{added.inspect}; removed: #{removed.inspect}. " \
            "Review, then approve with: bundle exec ruby scripts/check-email-feed.rb --bless" \
            "#{danger.any? ? ' --force' : ''} (then commit the manifest)."
end

warnings.each { |w| warn "WARN  #{w}" }

if errors.any?
  errors.each { |e| warn "BLOCK #{e}" }
  warn "\nemail-feed: #{errors.size} blocking issue(s) — push refused."
  exit 1
end

puts "email-feed OK: #{current.size} approved item(s); no unexpected changes; no safety violations."
exit 0
