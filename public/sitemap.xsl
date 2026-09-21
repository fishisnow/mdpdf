<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sm xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>MdPdf XML Sitemap</title>
        <style>
          :root {
            --bg: hsl(214, 95%, 93%);
            --card: #fff;
            --ink: #111;
            --muted: #4b5563;
            --line: #111;
            --main: hsl(217, 100%, 66%);
            --shadow: 4px 4px 0 #111;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            background: var(--bg);
            color: var(--ink);
            font: 500 15px/1.5 ui-sans-serif, system-ui, "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif;
          }
          .wrap { width: min(1120px, calc(100% - 32px)); margin: 32px auto 48px; }
          .hero, .table-card {
            background: var(--card);
            border: 2px solid var(--line);
            border-radius: 5px;
            box-shadow: var(--shadow);
          }
          .hero { padding: 24px 28px; margin-bottom: 20px; }
          .brand {
            display: inline-block;
            margin-bottom: 12px;
            padding: 4px 10px;
            border: 2px solid var(--line);
            border-radius: 5px;
            background: var(--main);
            font-weight: 700;
            font-size: 22px;
            text-decoration: none;
            color: var(--ink);
            box-shadow: var(--shadow);
          }
          h1 { margin: 0 0 8px; font-size: 28px; }
          .lead { margin: 0 0 14px; color: var(--muted); max-width: 62ch; }
          .stats { display: flex; flex-wrap: wrap; gap: 8px; }
          .stat {
            padding: 4px 10px;
            border: 2px solid var(--line);
            border-radius: 5px;
            background: var(--bg);
            font-size: 13px;
            font-weight: 700;
          }
          .table-card { overflow: auto; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px 16px; text-align: left; vertical-align: top; border-bottom: 1px solid #d1d5db; }
          th {
            position: sticky;
            top: 0;
            background: #f8fafc;
            font-size: 12px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          tbody tr:nth-child(even) { background: #f8fbff; }
          tbody tr:hover { background: hsl(214, 95%, 93%); }
          .url { font-weight: 700; word-break: break-all; color: #1d4ed8; text-decoration: none; }
          .url:hover { text-decoration: underline; }
          .alts { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
          .alt {
            display: inline-block;
            padding: 1px 6px;
            border: 1px solid var(--line);
            border-radius: 999px;
            background: #fff;
            color: var(--ink);
            font-size: 11px;
            font-weight: 700;
            text-decoration: none;
          }
          .alt:hover { background: var(--main); }
          .meta { white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; }
          .priority {
            display: inline-block;
            min-width: 2.5rem;
            padding: 2px 8px;
            border: 2px solid var(--line);
            border-radius: 5px;
            background: var(--main);
            font-weight: 700;
            text-align: center;
          }
          .foot { margin-top: 16px; color: var(--muted); font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <section class="hero">
            <a class="brand" href="/">MdPdf</a>
            <h1>XML Sitemap</h1>
            <p class="lead">
              This file is for search engines. The table below is an XSLT view so people can read the same XML in a browser.
            </p>
            <div class="stats">
              <span class="stat"><xsl:value-of select="count(sm:urlset/sm:url)"/> URLs</span>
              <span class="stat"><xsl:value-of select="count(sm:urlset/sm:url[1]/xhtml:link)"/> language versions per page</span>
            </div>
          </section>
          <section class="table-card">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>URL</th>
                  <th>Last modified</th>
                  <th>Change freq</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:urlset/sm:url">
                  <tr>
                    <td class="meta"><xsl:value-of select="position()"/></td>
                    <td>
                      <a class="url" href="{sm:loc}"><xsl:value-of select="sm:loc"/></a>
                      <div class="alts">
                        <xsl:for-each select="xhtml:link[@rel='alternate' and @hreflang!='x-default']">
                          <a class="alt" href="{@href}"><xsl:value-of select="@hreflang"/></a>
                        </xsl:for-each>
                      </div>
                    </td>
                    <td class="meta"><xsl:value-of select="sm:lastmod"/></td>
                    <td class="meta"><xsl:value-of select="sm:changefreq"/></td>
                    <td><span class="priority"><xsl:value-of select="sm:priority"/></span></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </section>
          <p class="foot">Generated for mdpdf.net. Crawlers read the raw XML; this stylesheet is only for the browser view.</p>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
