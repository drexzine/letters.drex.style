---
layout: page
permalink: /topics/
title: "Browse by topic."
eyebrow: "the index"
dek: "Every letter, grouped by what it's about. A way in if you'd rather follow a thread than read in order."
sitemap: true
---

The letters build on each other, but you don't have to read them in order. Pick a thread
and follow it. New here? [Start here](/start-here/) instead.

{% assign labels = "canon:How the practice works|vision:What we're building|manifesto:First principles|lore:Where it came from|lineage:The traditions we descend from|strategy:How we hold it together" %}

{% for tag in site.tags %}
  {% assign tag_name = tag[0] %}
  {% assign tag_posts = tag[1] %}
  {% assign label = tag_name %}
  {% assign label_pairs = labels | split: "|" %}
  {% for pair in label_pairs %}
    {% assign kv = pair | split: ":" %}
    {% if kv[0] == tag_name %}{% assign label = kv[1] %}{% endif %}
  {% endfor %}

## {{ label }}

{% for post in tag_posts %}
- [{{ post.title }}]({{ post.url | relative_url }})
{% endfor %}
{% endfor %}

Want them as they land? Pull up a chair on [the online Circle](/join-online/), or follow the
[feed](/feed.xml).
