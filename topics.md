---
layout: page
permalink: /topics/
title: "Browse by topic."
eyebrow: "the index"
dek: "Every letter, grouped by what it's about."
sitemap: true
---

Browse by topics to see threads of Circle Letters.

{% assign labels = "talks:Talks|circle:Circle|stanford:Stanford|xchange models:XChange Models" %}

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

Want them as they are shared? [Join Drex Circles](/join-online/)
