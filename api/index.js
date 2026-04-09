"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/http-server.ts
var http_server_exports = {};
__export(http_server_exports, {
  default: () => http_server_default
});
module.exports = __toCommonJS(http_server_exports);
var import_express = __toESM(require("express"), 1);
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_streamableHttp = require("@modelcontextprotocol/sdk/server/streamableHttp.js");

// src/tools/blog.ts
var import_zod = require("zod");

// src/services/supabase.ts
var import_axios = __toESM(require("axios"), 1);
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }
  return { url: url.replace(/\/$/, ""), key };
}
function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    // Return the full row on insert / update
    Prefer: "return=representation"
  };
}
async function supabaseSelect(table, params = {}, select = "*") {
  const { url, key } = getSupabaseConfig();
  const config = {
    method: "GET",
    url: `${url}/rest/v1/${table}`,
    headers: headers(key),
    params: { select, ...params },
    timeout: 3e4
  };
  try {
    const response = await (0, import_axios.default)(config);
    return response.data;
  } catch (error) {
    throw new Error(formatSupabaseError(error, `SELECT from ${table}`));
  }
}
async function supabaseSelectOne(table, filter, select = "*") {
  const { url, key } = getSupabaseConfig();
  const params = { select, limit: "1" };
  for (const [col, val] of Object.entries(filter)) {
    params[col] = `eq.${val}`;
  }
  const config = {
    method: "GET",
    url: `${url}/rest/v1/${table}`,
    headers: headers(key),
    params,
    timeout: 3e4
  };
  try {
    const response = await (0, import_axios.default)(config);
    const rows = response.data;
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    throw new Error(formatSupabaseError(error, `SELECT one from ${table}`));
  }
}
async function supabaseSelectPaginated(table, {
  select = "*",
  filters = {},
  order,
  limit = 20,
  offset = 0
}) {
  const { url, key } = getSupabaseConfig();
  const params = {
    select,
    limit,
    offset,
    ...filters
  };
  if (order) params["order"] = order;
  const hdrs = {
    ...headers(key),
    Prefer: "count=exact"
  };
  const config = {
    method: "GET",
    url: `${url}/rest/v1/${table}`,
    headers: hdrs,
    params,
    timeout: 3e4
  };
  try {
    const response = await (0, import_axios.default)(config);
    const contentRange = response.headers["content-range"];
    const total = contentRange ? parseInt(contentRange.split("/")[1] ?? "0", 10) : 0;
    return { rows: response.data, total };
  } catch (error) {
    throw new Error(formatSupabaseError(error, `paginated SELECT from ${table}`));
  }
}
async function supabaseInsert(table, data) {
  const { url, key } = getSupabaseConfig();
  const config = {
    method: "POST",
    url: `${url}/rest/v1/${table}`,
    headers: headers(key),
    data,
    timeout: 3e4
  };
  try {
    const response = await (0, import_axios.default)(config);
    const rows = response.data;
    return rows[0];
  } catch (error) {
    throw new Error(formatSupabaseError(error, `INSERT into ${table}`));
  }
}
async function supabaseUpdate(table, filter, data) {
  const { url, key } = getSupabaseConfig();
  const params = {};
  for (const [col, val] of Object.entries(filter)) {
    params[col] = `eq.${val}`;
  }
  const config = {
    method: "PATCH",
    url: `${url}/rest/v1/${table}`,
    headers: headers(key),
    params,
    data,
    timeout: 3e4
  };
  try {
    const response = await (0, import_axios.default)(config);
    return response.data;
  } catch (error) {
    throw new Error(formatSupabaseError(error, `UPDATE ${table}`));
  }
}
async function supabaseDelete(table, filter) {
  const { url, key } = getSupabaseConfig();
  const params = {};
  for (const [col, val] of Object.entries(filter)) {
    params[col] = `eq.${val}`;
  }
  const config = {
    method: "DELETE",
    url: `${url}/rest/v1/${table}`,
    headers: { ...headers(key), Prefer: "return=minimal" },
    params,
    timeout: 3e4
  };
  try {
    await (0, import_axios.default)(config);
  } catch (error) {
    throw new Error(formatSupabaseError(error, `DELETE from ${table}`));
  }
}
function formatSupabaseError(error, context) {
  if (error instanceof import_axios.AxiosError) {
    if (error.response) {
      const { status, data } = error.response;
      const msg = typeof data === "object" && data !== null ? data["message"] ?? JSON.stringify(data) : String(data);
      return `Supabase error on ${context} (HTTP ${status}): ${msg}`;
    }
    if (error.code === "ECONNABORTED") {
      return `Supabase timeout on ${context}. Try again.`;
    }
  }
  return `Unexpected error on ${context}: ${error instanceof Error ? error.message : String(error)}`;
}

// src/constants.ts
var CHARACTER_LIMIT = 25e3;
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
var BLOG_IMAGE_FOLDER = "blog";
var SUPPORTED_IMAGE_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml"
};
var BLOCK_TYPE_SLUGS = [
  "executive_summary",
  "section_header",
  "paragraph",
  "image",
  "script_box",
  "quote",
  "callout",
  "list",
  "data_highlight",
  "internal_links",
  "cta_button",
  "divider"
];
var POST_STATUSES = ["draft", "published", "archived"];

// src/tools/blog.ts
function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-") + `-${Math.floor(Date.now() / 1e3)}`;
}
function toStructured(value) {
  return JSON.parse(JSON.stringify(value));
}
function estimateReadingTime(blocks) {
  const totalWords = blocks.flatMap((b) => [b.content, b.heading_text, b.media_caption]).filter(Boolean).join(" ").split(/\s+/).length;
  return Math.max(1, Math.ceil(totalWords / 200));
}
function truncate(text) {
  if (text.length <= CHARACTER_LIMIT) return text;
  return text.slice(0, CHARACTER_LIMIT) + "\n\n[Response truncated \u2014 use offset/limit to see more]";
}
function registerBlogTools(server) {
  server.registerTool(
    "blog_list_posts",
    {
      title: "List Blog Posts",
      description: `List blog posts from Read & Rate with optional filtering and pagination.

Args:
  - status ('draft' | 'published' | 'archived' | undefined): Filter by post status. Omit to get all.
  - category_id (string | undefined): Filter by category UUID.
  - author_id (string | undefined): Filter by author UUID.
  - featured (boolean | undefined): Filter to featured posts only.
  - limit (number): Max results (1-100, default 20).
  - offset (number): Pagination offset (default 0).
  - response_format ('markdown' | 'json'): Output format (default 'markdown').

Returns paginated list of posts with id, title, slug, status, category, author, published_at.`,
      inputSchema: import_zod.z.object({
        status: import_zod.z.enum(POST_STATUSES).optional().describe("Filter by post status"),
        category_id: import_zod.z.string().uuid().optional().describe("Filter by category UUID"),
        author_id: import_zod.z.string().uuid().optional().describe("Filter by author UUID"),
        featured: import_zod.z.boolean().optional().describe("Filter to featured posts only"),
        limit: import_zod.z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT).describe("Max results"),
        offset: import_zod.z.number().int().min(0).default(0).describe("Pagination offset"),
        response_format: import_zod.z.enum(["markdown", "json"]).default("markdown")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ status, category_id, author_id, featured, limit, offset, response_format }) => {
      try {
        const filters = {};
        if (status) filters["status"] = `eq.${status}`;
        if (category_id) filters["category_id"] = `eq.${category_id}`;
        if (author_id) filters["author_id"] = `eq.${author_id}`;
        if (featured !== void 0) filters["featured"] = `eq.${featured}`;
        const { rows, total } = await supabaseSelectPaginated("blog_posts", {
          select: "id,title,slug,status,cover_image_url,category_id,author_id,published_at,featured,reading_time,created_at,updated_at",
          filters,
          order: "created_at.desc",
          limit,
          offset
        });
        const output = {
          total,
          count: rows.length,
          offset,
          limit,
          has_more: total > offset + rows.length,
          next_offset: total > offset + rows.length ? offset + rows.length : void 0,
          posts: rows
        };
        if (response_format === "json") {
          return { content: [{ type: "text", text: truncate(JSON.stringify(output, null, 2)) }], structuredContent: toStructured(output) };
        }
        const lines = [`# Blog Posts (${total} total, showing ${rows.length})`, ""];
        for (const p of rows) {
          lines.push(`## ${p.title}`);
          lines.push(`- **ID**: ${p.id}`);
          lines.push(`- **Slug**: ${p.slug}`);
          lines.push(`- **Status**: ${p.status}`);
          if (p.published_at) lines.push(`- **Published**: ${p.published_at}`);
          lines.push(`- **Featured**: ${p.featured}`);
          lines.push(`- **Reading time**: ${p.reading_time ?? "?"} min`);
          lines.push("");
        }
        if (output.has_more) lines.push(`> More results available \u2014 use offset: ${output.next_offset}`);
        return { content: [{ type: "text", text: truncate(lines.join("\n")) }], structuredContent: toStructured(output) };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_get_post",
    {
      title: "Get Blog Post",
      description: `Fetch a single blog post with all its content blocks.

Args:
  - id (string | undefined): Post UUID. Use this or slug.
  - slug (string | undefined): Post URL slug. Use this or id.
  - response_format ('markdown' | 'json'): Output format (default 'json').

Returns full post metadata plus an ordered array of content blocks.`,
      inputSchema: import_zod.z.object({
        id: import_zod.z.string().uuid().optional().describe("Post UUID"),
        slug: import_zod.z.string().optional().describe("Post URL slug"),
        response_format: import_zod.z.enum(["markdown", "json"]).default("json")
      }).strict().refine((d) => d.id || d.slug, { message: "Provide either id or slug" }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ id, slug, response_format }) => {
      try {
        const filter = {};
        if (id) filter["id"] = id;
        else filter["slug"] = slug;
        const post = await supabaseSelectOne("blog_posts", filter);
        if (!post) {
          return { isError: true, content: [{ type: "text", text: `Post not found with ${id ? `id=${id}` : `slug=${slug}`}` }] };
        }
        const blocks = await supabaseSelect("blog_post_blocks", { post_id: `eq.${post.id}`, order: "position.asc" });
        const output = { post, blocks };
        if (response_format === "json") {
          return { content: [{ type: "text", text: truncate(JSON.stringify(output, null, 2)) }], structuredContent: toStructured(output) };
        }
        const lines = [`# ${post.title}`, "", `**Slug**: ${post.slug}`, `**Status**: ${post.status}`, `**Blocks**: ${blocks.length}`, ""];
        for (const b of blocks) {
          lines.push(`### [${b.position}] ${b.block_type_slug}`);
          if (b.heading_text) lines.push(`  Heading: ${b.heading_text}`);
          if (b.content) lines.push(`  Content: ${b.content.slice(0, 200)}${b.content.length > 200 ? "\u2026" : ""}`);
          if (b.media_url) lines.push(`  Media: ${b.media_url}`);
          if (b.link_url) lines.push(`  Link: ${b.link_text} \u2192 ${b.link_url}`);
          lines.push("");
        }
        return { content: [{ type: "text", text: truncate(lines.join("\n")) }], structuredContent: toStructured(output) };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_create_post",
    {
      title: "Create Blog Post",
      description: `Create a new blog post in Supabase (starts as draft).

Args:
  - title (string): Post title (required).
  - slug (string | undefined): URL slug. Auto-generated from title if omitted.
  - description (string | undefined): Short description / subtitle.
  - excerpt (string | undefined): Short excerpt for previews.
  - cover_image_url (string | undefined): Cover image URL (use r2_upload_image_* tools to get the URL).
  - category_id (string | undefined): Category UUID.
  - author_id (string | undefined): Author UUID.
  - tags (string[] | undefined): Array of tag strings.
  - featured (boolean | undefined): Mark as featured (default false).
  - meta_title (string | undefined): SEO title (defaults to title).
  - meta_description (string | undefined): SEO description.

Returns the created post with its generated id and slug.`,
      inputSchema: import_zod.z.object({
        title: import_zod.z.string().min(1).max(200).describe("Post title"),
        slug: import_zod.z.string().optional().describe("URL slug (auto-generated if omitted)"),
        description: import_zod.z.string().optional().describe("Short description"),
        excerpt: import_zod.z.string().optional().describe("Short excerpt for previews"),
        cover_image_url: import_zod.z.string().url().optional().describe("Cover image URL"),
        category_id: import_zod.z.string().uuid().optional().describe("Category UUID"),
        author_id: import_zod.z.string().uuid().optional().describe("Author UUID"),
        tags: import_zod.z.array(import_zod.z.string()).optional().describe("Array of tags"),
        featured: import_zod.z.boolean().default(false).describe("Mark as featured"),
        meta_title: import_zod.z.string().optional().describe("SEO title"),
        meta_description: import_zod.z.string().optional().describe("SEO meta description")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async (params) => {
      try {
        const slug = params.slug ?? toSlug(params.title);
        const postData = {
          title: params.title,
          slug,
          status: "draft",
          featured: params.featured,
          meta_title: params.meta_title ?? params.title
        };
        if (params.description) postData["description"] = params.description;
        if (params.excerpt) postData["excerpt"] = params.excerpt;
        if (params.cover_image_url) postData["cover_image_url"] = params.cover_image_url;
        if (params.category_id) postData["category_id"] = params.category_id;
        if (params.author_id) postData["author_id"] = params.author_id;
        if (params.tags) postData["tags"] = params.tags;
        if (params.meta_description) postData["meta_description"] = params.meta_description;
        const post = await supabaseInsert("blog_posts", postData);
        return {
          content: [{ type: "text", text: `\u2705 Blog post created!

ID: ${post.id}
Slug: ${post.slug}
Status: draft

Next steps:
- Add blocks with blog_add_block
- Upload images with r2_upload_image_from_url
- Publish with blog_publish_post` }],
          structuredContent: toStructured(post)
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_update_post",
    {
      title: "Update Blog Post",
      description: `Update blog post metadata. Only the fields you provide will be changed.

Args:
  - id (string): Post UUID (required).
  - title / description / excerpt / cover_image_url / category_id / author_id / tags / featured / meta_title / meta_description / reading_time: All optional \u2014 only provided fields are updated.

Returns the updated post.`,
      inputSchema: import_zod.z.object({
        id: import_zod.z.string().uuid().describe("Post UUID"),
        title: import_zod.z.string().min(1).max(200).optional(),
        description: import_zod.z.string().optional(),
        excerpt: import_zod.z.string().optional(),
        cover_image_url: import_zod.z.string().url().optional(),
        category_id: import_zod.z.string().uuid().optional(),
        author_id: import_zod.z.string().uuid().optional(),
        tags: import_zod.z.array(import_zod.z.string()).optional(),
        featured: import_zod.z.boolean().optional(),
        meta_title: import_zod.z.string().optional(),
        meta_description: import_zod.z.string().optional(),
        reading_time: import_zod.z.number().int().min(1).optional().describe("Override auto-calculated reading time (minutes)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ id, ...fields }) => {
      try {
        const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
        for (const [k, v] of Object.entries(fields)) {
          if (v !== void 0) updates[k] = v;
        }
        const rows = await supabaseUpdate("blog_posts", { id }, updates);
        if (!rows.length) {
          return { isError: true, content: [{ type: "text", text: `Post not found: ${id}` }] };
        }
        return {
          content: [{ type: "text", text: `\u2705 Post updated: ${rows[0].title}` }],
          structuredContent: toStructured(rows[0])
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_publish_post",
    {
      title: "Publish / Unpublish Blog Post",
      description: `Publish or unpublish a blog post. Also auto-calculates reading time from its blocks.

Args:
  - id (string): Post UUID.
  - action ('publish' | 'unpublish' | 'archive'): What to do.

Returns the updated post.`,
      inputSchema: import_zod.z.object({
        id: import_zod.z.string().uuid().describe("Post UUID"),
        action: import_zod.z.enum(["publish", "unpublish", "archive"]).describe("Action to perform")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ id, action }) => {
      try {
        const statusMap = { publish: "published", unpublish: "draft", archive: "archived" };
        const newStatus = statusMap[action];
        const updates = {
          status: newStatus,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (action === "publish") {
          const post = await supabaseSelectOne("blog_posts", { id });
          if (!post) return { isError: true, content: [{ type: "text", text: `Post not found: ${id}` }] };
          if (!post.published_at) updates["published_at"] = (/* @__PURE__ */ new Date()).toISOString();
          const blocks = await supabaseSelect("blog_post_blocks", { post_id: `eq.${id}` });
          updates["reading_time"] = estimateReadingTime(blocks);
        }
        const rows = await supabaseUpdate("blog_posts", { id }, updates);
        if (!rows.length) return { isError: true, content: [{ type: "text", text: `Post not found: ${id}` }] };
        const emoji = { publish: "\u{1F680}", unpublish: "\u{1F4DD}", archive: "\u{1F4E6}" }[action];
        return {
          content: [{ type: "text", text: `${emoji} Post "${rows[0].title}" is now ${newStatus}` }],
          structuredContent: toStructured(rows[0])
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_add_block",
    {
      title: "Add Block to Blog Post",
      description: `Add a content block to a blog post. Appends to the end by default.

Block types and their key fields:
  - executive_summary \u2192 content (text)
  - section_header    \u2192 heading_text, heading_level (2-3), step_number (optional)
  - paragraph         \u2192 content (HTML or plain text)
  - image             \u2192 media_url (R2 URL), media_alt, media_caption, figure_number
  - script_box        \u2192 content (copyable template/code)
  - quote             \u2192 content (quote text), settings.attribution (optional)
  - callout           \u2192 content (tip/warning text), settings.type ('tip'|'warning'|'info')
  - list              \u2192 content (markdown list or JSON array of strings)
  - data_highlight    \u2192 content (statistic text), settings.metric, settings.source
  - internal_links    \u2192 link_url, link_text, is_external
  - cta_button        \u2192 link_url, link_text, is_external
  - divider           \u2192 (no content needed)

Args:
  - post_id (string): Post UUID.
  - block_type_slug (string): One of the block type slugs above.
  - content / heading_text / heading_level / step_number / media_url / media_alt /
    media_caption / figure_number / link_url / link_text / is_external / settings:
    Provide the relevant fields for the block type.
  - position (number | undefined): Insert at this position (0-based). Appends if omitted.

Returns the created block with its id.`,
      inputSchema: import_zod.z.object({
        post_id: import_zod.z.string().uuid().describe("Post UUID"),
        block_type_slug: import_zod.z.enum(BLOCK_TYPE_SLUGS).describe("Block type"),
        content: import_zod.z.string().optional().describe("Main text content"),
        heading_text: import_zod.z.string().optional().describe("Heading text (section_header)"),
        heading_level: import_zod.z.number().int().min(1).max(6).optional().describe("Heading level 1-6"),
        step_number: import_zod.z.number().int().min(1).optional().describe("Step number for numbered sections"),
        media_url: import_zod.z.string().url().optional().describe("Image/media URL (use R2 upload tools)"),
        media_alt: import_zod.z.string().optional().describe("Image alt text"),
        media_caption: import_zod.z.string().optional().describe("Image caption"),
        figure_number: import_zod.z.number().int().min(1).optional().describe("Figure number"),
        link_url: import_zod.z.string().url().optional().describe("Link URL"),
        link_text: import_zod.z.string().optional().describe("Link display text"),
        is_external: import_zod.z.boolean().default(false).describe("Whether the link opens externally"),
        settings: import_zod.z.record(import_zod.z.unknown()).optional().describe("Additional block settings (JSON object)"),
        position: import_zod.z.number().int().min(0).optional().describe("Insert position (appends if omitted)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ post_id, position, ...fields }) => {
      try {
        let insertPosition = position;
        if (insertPosition === void 0) {
          const existing = await supabaseSelect(
            "blog_post_blocks",
            { post_id: `eq.${post_id}`, order: "position.desc", limit: 1 },
            "position"
          );
          insertPosition = existing.length > 0 ? existing[0].position + 1 : 0;
        }
        const blockData = {
          post_id,
          position: insertPosition,
          is_external: fields.is_external ?? false,
          automation_status: "manual"
        };
        const optionalFields = [
          "block_type_slug",
          "content",
          "heading_text",
          "heading_level",
          "step_number",
          "media_url",
          "media_alt",
          "media_caption",
          "figure_number",
          "link_url",
          "link_text",
          "settings"
        ];
        for (const key of optionalFields) {
          if (fields[key] !== void 0) blockData[key] = fields[key];
        }
        const block = await supabaseInsert("blog_post_blocks", blockData);
        const allBlocks = await supabaseSelect("blog_post_blocks", { post_id: `eq.${post_id}` });
        await supabaseUpdate("blog_posts", { id: post_id }, {
          reading_time: estimateReadingTime(allBlocks),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        return {
          content: [{ type: "text", text: `\u2705 Block added!

ID: ${block.id}
Type: ${block.block_type_slug}
Position: ${block.position}` }],
          structuredContent: toStructured(block)
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_update_block",
    {
      title: "Update Blog Post Block",
      description: `Update one or more fields on an existing content block.

Args:
  - id (string): Block UUID.
  - Any of: content, heading_text, heading_level, step_number, media_url, media_alt,
    media_caption, figure_number, link_url, link_text, is_external, settings, position.

Returns the updated block.`,
      inputSchema: import_zod.z.object({
        id: import_zod.z.string().uuid().describe("Block UUID"),
        content: import_zod.z.string().optional(),
        heading_text: import_zod.z.string().optional(),
        heading_level: import_zod.z.number().int().min(1).max(6).optional(),
        step_number: import_zod.z.number().int().min(1).optional(),
        media_url: import_zod.z.string().url().optional(),
        media_alt: import_zod.z.string().optional(),
        media_caption: import_zod.z.string().optional(),
        figure_number: import_zod.z.number().int().min(1).optional(),
        link_url: import_zod.z.string().url().optional(),
        link_text: import_zod.z.string().optional(),
        is_external: import_zod.z.boolean().optional(),
        settings: import_zod.z.record(import_zod.z.unknown()).optional(),
        position: import_zod.z.number().int().min(0).optional()
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ id, ...fields }) => {
      try {
        const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
        for (const [k, v] of Object.entries(fields)) {
          if (v !== void 0) updates[k] = v;
        }
        const rows = await supabaseUpdate("blog_post_blocks", { id }, updates);
        if (!rows.length) return { isError: true, content: [{ type: "text", text: `Block not found: ${id}` }] };
        return {
          content: [{ type: "text", text: `\u2705 Block updated (${rows[0].block_type_slug} at position ${rows[0].position})` }],
          structuredContent: toStructured(rows[0])
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_delete_block",
    {
      title: "Delete Blog Post Block",
      description: `Permanently delete a content block from a blog post.

Args:
  - id (string): Block UUID.`,
      inputSchema: import_zod.z.object({
        id: import_zod.z.string().uuid().describe("Block UUID to delete")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false }
    },
    async ({ id }) => {
      try {
        const block = await supabaseSelectOne("blog_post_blocks", { id });
        if (!block) return { isError: true, content: [{ type: "text", text: `Block not found: ${id}` }] };
        await supabaseDelete("blog_post_blocks", { id });
        const remainingBlocks = await supabaseSelect("blog_post_blocks", { post_id: `eq.${block.post_id}` });
        await supabaseUpdate("blog_posts", { id: block.post_id }, {
          reading_time: estimateReadingTime(remainingBlocks),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        return {
          content: [{ type: "text", text: `\u{1F5D1}\uFE0F Block deleted (${block.block_type_slug}, was at position ${block.position})` }]
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_list_categories",
    {
      title: "List Blog Categories",
      description: `List all active blog categories. Use the returned id when creating or updating posts.`,
      inputSchema: import_zod.z.object({
        include_inactive: import_zod.z.boolean().default(false).describe("Include inactive categories")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ include_inactive }) => {
      try {
        const filters = {};
        if (!include_inactive) filters["is_active"] = "eq.true";
        const cats = await supabaseSelect("blog_categories", {
          ...filters,
          select: "id,name,slug,description,display_order,is_active",
          order: "display_order.asc"
        });
        const lines = ["# Blog Categories", ""];
        for (const c of cats) {
          lines.push(`- **${c.name}** (id: \`${c.id}\`, slug: ${c.slug})`);
          if (c.description) lines.push(`  ${c.description}`);
        }
        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: toStructured({ categories: cats })
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_list_authors",
    {
      title: "List Blog Authors",
      description: `List all active blog authors. Use the returned id when creating or updating posts.`,
      inputSchema: import_zod.z.object({
        include_inactive: import_zod.z.boolean().default(false).describe("Include inactive authors")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ include_inactive }) => {
      try {
        const filters = {};
        if (!include_inactive) filters["is_active"] = "eq.true";
        const authors = await supabaseSelect("blog_authors", {
          ...filters,
          select: "id,name,slug,role,bio,avatar_url,expertise_areas,is_active",
          order: "name.asc"
        });
        const lines = ["# Blog Authors", ""];
        for (const a of authors) {
          lines.push(`- **${a.name}** (id: \`${a.id}\`)`);
          if (a.role) lines.push(`  Role: ${a.role}`);
          if (a.expertise_areas?.length) lines.push(`  Expertise: ${a.expertise_areas.join(", ")}`);
        }
        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: toStructured({ authors })
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "blog_list_block_types",
    {
      title: "List Blog Block Types",
      description: `List all available blog content block types with their slugs and descriptions. Reference this when building a post structure.`,
      inputSchema: import_zod.z.object({}).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async () => {
      try {
        const types = await supabaseSelect("blog_block_types", {
          select: "id,name,slug,description,icon,automation_prompt,display_order,is_active",
          order: "display_order.asc"
        });
        const lines = ["# Blog Block Types", ""];
        for (const t of types) {
          lines.push(`### ${t.name} (\`${t.slug}\`)`);
          if (t.description) lines.push(`${t.description}`);
          if (t.automation_prompt) lines.push(`*AI hint: ${t.automation_prompt}*`);
          lines.push("");
        }
        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: toStructured({ block_types: types })
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
}

// src/tools/media.ts
var import_zod2 = require("zod");

// src/services/r2.ts
var import_client_s3 = require("@aws-sdk/client-s3");
var import_axios2 = __toESM(require("axios"), 1);
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    );
  }
  return new import_client_s3.S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
}
function getR2Config() {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!bucket) throw new Error("Missing R2_BUCKET_NAME environment variable.");
  if (!publicUrl) throw new Error("Missing R2_PUBLIC_URL environment variable.");
  return { bucket, publicUrl };
}
function guessContentType(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return SUPPORTED_IMAGE_TYPES[ext] ?? "application/octet-stream";
}
function sanitiseFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function buildR2Key(postSlug, imageType, ext = "png") {
  const safeSlug = sanitiseFileName(postSlug);
  const timestamp = Math.floor(Date.now() / 1e3);
  const safeExt = ext.replace(/^\./, "").toLowerCase() || "png";
  return `${BLOG_IMAGE_FOLDER}/${safeSlug}-${timestamp}-${imageType}.${safeExt}`;
}
async function uploadBuffer(key, buffer, contentType) {
  const client = getR2Client();
  const { bucket, publicUrl } = getR2Config();
  const command = new import_client_s3.PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable"
  });
  await client.send(command);
  return {
    success: true,
    file_path: key,
    public_url: `${publicUrl}/${key}`,
    content_type: contentType,
    size_bytes: buffer.byteLength
  };
}
async function uploadImageFromUrl(imageUrl, r2Key) {
  let buffer;
  let contentType;
  try {
    const response = await import_axios2.default.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 6e4,
      maxContentLength: 50 * 1024 * 1024
      // 50 MB max
    });
    buffer = Buffer.from(response.data);
    contentType = response.headers["content-type"]?.split(";")[0] ?? guessContentType(r2Key);
  } catch (error) {
    throw new Error(
      `Failed to fetch image from URL "${imageUrl}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return uploadBuffer(r2Key, buffer, contentType);
}
async function uploadImageFromBase64(base64Data, r2Key, contentType) {
  const rawBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  if (!rawBase64) throw new Error("Empty base64 data provided.");
  const buffer = Buffer.from(rawBase64, "base64");
  const resolvedType = contentType ?? guessContentType(r2Key) ?? "image/png";
  return uploadBuffer(r2Key, buffer, resolvedType);
}
async function listBlogImages(postSlug, limit = 50) {
  const client = getR2Client();
  const { bucket, publicUrl } = getR2Config();
  const prefix = postSlug ? `${BLOG_IMAGE_FOLDER}/${sanitiseFileName(postSlug)}-` : `${BLOG_IMAGE_FOLDER}/`;
  const command = new import_client_s3.ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: limit
  });
  let output;
  try {
    output = await client.send(command);
  } catch (error) {
    throw new Error(
      `Failed to list R2 images: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  return (output.Contents ?? []).map((obj) => ({
    key: obj.Key ?? "",
    public_url: `${publicUrl}/${obj.Key}`,
    last_modified: obj.LastModified?.toISOString(),
    size_bytes: obj.Size
  }));
}

// src/tools/media.ts
function toStructured2(value) {
  return JSON.parse(JSON.stringify(value));
}
function extFromPath(path) {
  const m = path.split("?")[0].match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "png";
}
var IMAGE_TYPE_VALUES = ["cover", "section1", "section2", "section3"];
function registerMediaTools(server) {
  server.registerTool(
    "r2_upload_image_from_url",
    {
      title: "Upload Image to R2 from URL",
      description: `Fetch an image from a remote URL and upload it to Cloudflare R2,
following the Read & Rate naming convention.

File naming (automatic):
  blog/{post_slug}-{timestamp}-cover.{ext}
  blog/{post_slug}-{timestamp}-section1.{ext}
  blog/{post_slug}-{timestamp}-section2.{ext}
  blog/{post_slug}-{timestamp}-section3.{ext}

Args:
  - source_url   : Full URL of the image to fetch (http/https).
  - post_slug    : URL slug of the blog post (e.g. "book-marketing-trends-2026").
  - image_type   : One of: cover | section1 | section2 | section3.
                   \u2022 cover    \u2192 the post's cover / hero image
                   \u2022 section1 \u2192 first data-highlight infographic
                   \u2022 section2 \u2192 second data-highlight infographic
                   \u2022 section3 \u2192 third data-highlight infographic

Returns the public CDN URL to use in blog_update_post (cover) or blog_add_block (image).`,
      inputSchema: import_zod2.z.object({
        source_url: import_zod2.z.string().url().describe("Remote image URL to fetch"),
        post_slug: import_zod2.z.string().min(1).describe("Blog post URL slug (e.g. 'book-marketing-2026')"),
        image_type: import_zod2.z.enum(IMAGE_TYPE_VALUES).describe(
          "Image role: cover | section1 | section2 | section3"
        )
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ source_url, post_slug, image_type }) => {
      try {
        const ext = extFromPath(source_url);
        const r2Key = buildR2Key(post_slug, image_type, ext);
        const result = await uploadImageFromUrl(source_url, r2Key);
        const hint = image_type === "cover" ? `Use this URL in blog_create_post or blog_update_post as cover_image_url.` : `Use this URL in blog_add_block with block_type_slug='image' and media_url='${result.public_url}'.`;
        return {
          content: [{
            type: "text",
            text: `\u2705 Image uploaded to R2!

Public URL: ${result.public_url}
Key: ${result.file_path}
Size: ${(result.size_bytes / 1024).toFixed(1)} KB
Type: ${result.content_type}

${hint}`
          }],
          structuredContent: toStructured2(result)
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "r2_upload_image_base64",
    {
      title: "Upload Base64 Image to R2",
      description: `Upload a base64-encoded image to Cloudflare R2,
following the Read & Rate naming convention.

File naming (automatic):
  blog/{post_slug}-{timestamp}-cover.png
  blog/{post_slug}-{timestamp}-section1.png   \u2190 first infographic
  blog/{post_slug}-{timestamp}-section2.png   \u2190 second infographic
  blog/{post_slug}-{timestamp}-section3.png   \u2190 third infographic

Args:
  - base64_data  : Base64-encoded image. Can include data URI prefix (data:image/png;base64,...).
  - post_slug    : URL slug of the blog post (e.g. "book-marketing-trends-2026").
  - image_type   : One of: cover | section1 | section2 | section3.
  - content_type : MIME type (optional, defaults to image/png).

Returns the public CDN URL.`,
      inputSchema: import_zod2.z.object({
        base64_data: import_zod2.z.string().min(1).describe("Base64-encoded image (with or without data URI prefix)"),
        post_slug: import_zod2.z.string().min(1).describe("Blog post URL slug"),
        image_type: import_zod2.z.enum(IMAGE_TYPE_VALUES).describe(
          "Image role: cover | section1 | section2 | section3"
        ),
        content_type: import_zod2.z.string().optional().describe("MIME type (e.g. image/png, image/jpeg)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    async ({ base64_data, post_slug, image_type, content_type }) => {
      try {
        const ext = content_type ? content_type.split("/")[1] ?? "png" : "png";
        const r2Key = buildR2Key(post_slug, image_type, ext);
        const result = await uploadImageFromBase64(base64_data, r2Key, content_type);
        const hint = image_type === "cover" ? `Use this URL in blog_create_post or blog_update_post as cover_image_url.` : `Use this URL in blog_add_block with block_type_slug='image' and media_url='${result.public_url}'.`;
        return {
          content: [{
            type: "text",
            text: `\u2705 Image uploaded to R2!

Public URL: ${result.public_url}
Key: ${result.file_path}
Size: ${(result.size_bytes / 1024).toFixed(1)} KB
Type: ${result.content_type}

${hint}`
          }],
          structuredContent: toStructured2(result)
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "r2_list_blog_images",
    {
      title: "List Blog Images in R2",
      description: `List images stored in the Cloudflare R2 blog folder.
Useful for finding existing infographics or cover images you want to reuse.

Args:
  - post_slug (string | undefined): Filter to images for a specific post slug.
                                    Matches files whose name starts with that slug.
  - limit (number): Max results (default 50, max 200).

Returns a list of image keys and their public URLs.`,
      inputSchema: import_zod2.z.object({
        post_slug: import_zod2.z.string().optional().describe("Filter by post slug prefix (e.g. 'book-marketing-2026')"),
        limit: import_zod2.z.number().int().min(1).max(200).default(50).describe("Max results")
      }).strict(),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    },
    async ({ post_slug, limit }) => {
      try {
        const images = await listBlogImages(post_slug, limit);
        if (!images.length) {
          const prefix = post_slug ? `blog/ (matching '${post_slug}')` : "blog/";
          return { content: [{ type: "text", text: `No images found in R2 under ${prefix}.` }], structuredContent: toStructured2({ images: [] }) };
        }
        const lines = [`# R2 Blog Images (${images.length} found)`, ""];
        for (const img of images) {
          lines.push(`- [${img.key}](${img.public_url})`);
          if (img.size_bytes) lines.push(`  ${(img.size_bytes / 1024).toFixed(1)} KB \u2014 last modified: ${img.last_modified ?? "unknown"}`);
        }
        return {
          content: [{ type: "text", text: lines.join("\n") }],
          structuredContent: toStructured2({ images })
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
}

// src/tools/kie.ts
var import_zod3 = require("zod");

// src/services/kie.ts
var import_axios3 = __toESM(require("axios"), 1);
var KIE_BASE_URL = "https://api.kie.ai/api/v1/jobs";
var DEFAULT_POLL_INTERVAL_MS = 8e3;
var DEFAULT_MAX_ATTEMPTS = 30;
function getKieApiKey() {
  const key = process.env.KIE_AI_API_KEY;
  if (!key) throw new Error(
Missing KIE_AI_API_KEY environment variable.");
  return key;
}
function kieHeaders() {
  return {
    Authorization: `Bearer ${getKieApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}
async function createKieTask(model, input) {
  try {
    const response = await import_axios3.default.post(
      `${KIE_BASE_URL}/createTask`,
      { model, input },
      { headers: kieHeaders(), timeout: 3e4 }
    );
    const { code, data, message } = response.data;
    if (code !== 200 || !data?.taskId) {
      throw new Error(`KIE.AI createTask failed (code ${code}): ${message ?? JSON.stringify(response.data)}`);
    }
    return data.taskId;
  } catch (error) {
    throw new Error(formatKieError(error, "createTask"));
  }
}
async function pollKieTask(taskId, maxAttempts = DEFAULT_MAX_ATTEMPTS, intervalMs = DEFAULT_POLL_INTERVAL_MS) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await sleep(intervalMs);
    let detail;
    try {
      const response = await import_axios3.default.get(
        `${KIE_BASE_URL}/recordInfo`,
        {
          params: { taskId },
          headers: kieHeaders(),
          timeout: 3e4
        }
      );
      if (response.data.code !== 200) {
        throw new Error(`KIE.AI recordInfo returned code ${response.data.code}`);
      }
      detail = response.data.data;
    } catch (error) {
      throw new Error(formatKieError(error, `recordInfo (attempt ${attempt})`));
    }
    if (detail.state === "success") {
      const imageUrl = extractFirstImageUrl(detail.resultJson);
      if (!imageUrl) {
        throw new Error(`KIE.AI task ${taskId} succeeded but no image URL found in resultJson: ${detail.resultJson}`);
      }
      return imageUrl;
    }
    if (detail.state === "fail") {
      throw new Error(`KIE.AI task ${taskId} failed. resultJson: ${detail.resultJson}`);
    }
  }
  throw new Error(
    `KIE.AI task ${taskId} did not complete after ${maxAttempts} attempts (~${Math.round(maxAttempts * intervalMs / 6e4)} min). Try increasing poll attempts or interval.`
  );
}
function extractFirstImageUrl(resultJson) {
  if (!resultJson) return null;
  try {
    const parsed = JSON.parse(resultJson);
    return parsed.resultUrls?.[0] ?? null;
  } catch {
    return null;
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function formatKieError(error, context) {
  if (error instanceof import_axios3.AxiosError) {
    if (error.response) {
      const { status, data } = error.response;
      return `KIE.AI error on ${context} (HTTP ${status}): ${JSON.stringify(data)}`;
    }
    if (error.code === "ECONNABORTED") {
      return `KIE.AI timeout on ${context}.`;
    }
  }
  return error instanceof Error ? error.message : `KIE.AI unexpected error on ${context}: ${String(error)}`;
}

// src/tools/kie.ts
function toStructured3(value) {
  return JSON.parse(JSON.stringify(value));
}
function registerKieTools(server) {
  server.registerTool(
    "blog_generate_image",
    {
      title: "Generate Blog Image (Nano Banana 2 \u2192 R2)",
      description: `Generate a blog image via Nano Banana 2 AI, upload to Cloudflare R2, and return the public CDN URL.
Handles the full pipeline automatically \u2014 no separate upload step needed.

Use this for BOTH cover images and infographics:
  - image_type='cover'       \u2192 16:9 landscape, editorial photography style
  - image_type='infographic' \u2192 4:3 landscape, data visualization / chart style

Args:
  - prompt     : Full Nano Banana 2 generation prompt. Be specific about composition,
                 data points (for infographics), colors, and style.
  - image_type : 'cover' or 'infographic'
  - slug       : Blog post URL slug \u2014 used for R2 file naming

Returns the public CDN URL. Use it directly in blog_update_post (cover) or blog_add_block (image).`,
      inputSchema: import_zod3.z.object({
        prompt: import_zod3.z.string().min(10).describe("Full image generation prompt"),
        image_type: import_zod3.z.enum(["cover", "infographic"]).describe("'cover' (16:9) or 'infographic' (4:3)"),
        slug: import_zod3.z.string().min(1).describe("Blog post slug for file naming")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ prompt, image_type, slug }) => {
      const kieApiKey = process.env.KIE_AI_API_KEY;
      if (!kieApiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "KIE_AI_API_KEY is not set. Add it to the MCP environment config and restart." }]
        };
      }
      try {
        const isCover = image_type === "cover";
        const aspectRatio = isCover ? "16:9" : "4:3";
        const imageLabel = isCover ? "cover" : `infographic-${Date.now()}`;
        const taskId = await createKieTask("nano-banana-2", {
          prompt,
          aspect_ratio: aspectRatio,
          resolution: "2K",
          output_format: "png"
        });
        const maxAttempts = isCover ? 25 : 20;
        const imageUrl = await pollKieTask(taskId, maxAttempts);
        const r2Key = buildR2Key(slug, imageLabel, "png");
        const result = await uploadImageFromUrl(imageUrl, r2Key);
        const nextStep = isCover ? `Next: call blog_update_post with cover_image_url="${result.public_url}"` : `Next: call blog_add_block with block_type_slug='image' and content="${result.public_url}"`;
        return {
          content: [{
            type: "text",
            text: [`\u2705 ${image_type} image generated!`, ``, `Public URL: ${result.public_url}`, `R2 Key: ${result.file_path}`, `Size: ${(result.size_bytes / 1024).toFixed(1)} KB`, ``, nextStep].join("\n")
          }],
          structuredContent: toStructured3({
            public_url: result.public_url,
            r2_key: result.file_path,
            image_type,
            task_id: taskId,
            size_bytes: result.size_bytes
          })
        };
      } catch (error) {
        return { isError: true, content: [{ type: "text", text: String(error) }] };
      }
    }
  );
  server.registerTool(
    "kie_generate_cover",
    {
      title: "Generate Blog Cover Image (KIE.AI)",
      description: `Generate a professional blog cover image using KIE.AI (Nano Banana 2 model),
upload it to Cloudflare R2, and return the public CDN URL.

Use this AFTER creating a blog post with blog_create_post, then pass the returned
public_url to blog_update_post as cover_image_url.

Args:
  - post_slug  : URL slug of the blog post (e.g. "book-marketing-trends-2026").
  - prompt     : Image generation prompt \u2014 describe the scene, mood, colors, and style.
                 Do NOT include text overlay instructions (Nano Banana 2 generates photo-style images).
                 Example: "Dramatic editorial photo contrasting traditional bookstore shelves
                 with a glowing digital tablet. Deep navy and gold tones. No text."
  - poll_attempts (optional): How many times to check if the image is ready (default 25, ~3 min).
                              Increase to 40 if the model is slow.

Returns:
  - public_url : CDN URL to use as cover_image_url in blog_update_post.
  - r2_key     : R2 object key (for Reference).`,
      inputSchema: import_zod3.z.object({
        post_slug: import_zod3.z.string().min(1).describe("Blog post URL slug"),
        prompt: import_zod3.z.string().min(10).describe("Image generation prompt for Nano Banana 2"),
        poll_attempts: import_zod3.z.number().int().min(5).max(60).default(25).describe("Max polling attempts (~8s each, default 25 = ~3 min)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ post_slug, prompt, poll_attempts }) => {
      try {
        const taskId = await createKieTask("nano-banana-2", {
          prompt,
          aspect_ratio: "16:9",
          resolution: "2K",
          output_format: "png"
        });
        const imageUrl = await pollKieTask(taskId, poll_attempts);
        const r2Key = buildR2Key(post_slug, "cover", "png");
        const result = await uploadImageFromUrl(imageUrl, r2Key);
        return {
          content: [{
            type: "text",
            text: [
              `\u2705 Cover image generated and uploaded!`,
              ``,
              `Public URL: ${result.public_url}`,
              `R2 Key: ${result.file_path}`,
              `Size: ${(result.size_bytes / 1024).toFixed(1)} KB`,
              ``,
              `Next step: call blog_update_post with cover_image_url="${result.public_url}"`
            ].join("\n")
          }],
          structuredContent: toStructured3({
            public_url: result.public_url,
            r2_key: result.file_path,
            task_id: taskId,
            size_bytes: result.size_bytes
          })
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: String(error) }]
        };
      }
    }
  );
  server.registerTool(
    "kie_generate_infographic",
    {
      title: "Generate Blog Infographic (KIE.AI)",
      description: `Generate a blog section infographic using KIE.AI (Ideogram V3 model),
upload it to Cloudflare R2, and return the public CDN URL.

Use this for data_highlight or image blocks within a blog post. Call once per infographic.
After getting the public_url, use blog_add_block with block_type_slug='image' and media_url=public_url.

image_type must be one of: section1 | section2 | section3
Use section1 for the first infographic, section2 for the second, section3 for the third.

Args:
  - post_slug   : URL slug of the blog post.
  - image_type  : 'section1' | 'section2' | 'section3' \u2014 position in the post.
  - prompt      : Ideogram V3 DESIGN-style prompt. Be specific about stats, layout,
                  colors, and typography. Ideogram V3 renders text in images.
                  Example: "Bold infographic: '70% of self-published authors earn under $1,000/year'.
                  Deep navy background, gold typography, minimal icons, clean data visualization."
  - poll_attempts (optional): Max polling attempts (default 15, ~2 min). Ideogram V3 is fast.

Returns:
  - public_url : CDN URL \u2014 use as media_url in blog_add_block.
  - r2_key     : R2 object key.`,
      inputSchema: import_zod3.z.object({
        post_slug: import_zod3.z.string().min(1).describe("Blog post URL slug"),
        image_type: import_zod3.z.enum(["section1", "section2", "section3"]).describe("Which infographic slot: section1, section2, or section3"),
        prompt: import_zod3.z.string().min(10).describe("Ideogram V3 DESIGN prompt \u2014 include stats, layout, color palette"),
        poll_attempts: import_zod3.z.number().int().min(5).max(60).default(15).describe("Max polling attempts (~8s each, default 15 = ~2 min)")
      }).strict(),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
    },
    async ({ post_slug, image_type, prompt, poll_attempts }) => {
      try {
        const taskId = await createKieTask("ideogram/v3-text-to-image", {
          prompt,
          rendering_speed: "BALANCED",
          style: "DESIGN",
          expand_prompt: false,
          image_size: "landscape_16_9",
          negative_prompt: "blurry, childish, cartoon, watermark, amateur, low quality, distorted text"
        });
        const imageUrl = await pollKieTask(taskId, poll_attempts);
        const r2Key = buildR2Key(post_slug, image_type, "png");
        const result = await uploadImageFromUrl(imageUrl, r2Key);
        return {
          content: [{
            type: "text",
            text: [
              `\u2705 Infographic (${image_type}) generated and uploaded!`,
              ``,
              `Public URL: ${result.public_url}`,
              `R2 Key: ${result.file_path}`,
              `Size: ${(result.size_bytes / 1024).toFixed(1)} KB`,
              ``,
              `Next step: call blog_add_block with block_type_slug='image' and media_url="${result.public_url}"`
            ].join("\n")
          }],
          structuredContent: toStructured3({
            public_url: result.public_url,
            r2_key: result.file_path,
            image_type,
            task_id: taskId,
            size_bytes: result.size_bytes
          })
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: String(error) }]
        };
      }
    }
  );
}

// src/http-server.ts
function createMcpServer() {
  const server = new import_mcp.McpServer({
    name: "readnrate-blog-mcp-server",
    version: "1.0.0"
  });
  registerBlogTools(server);
  registerMediaTools(server);
  registerKieTools(server);
  return server;
}
var app = (0, import_express.default)();
app.use(import_express.default.json());
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "readnrate-blog-mcp", version: "1.0.0" });
});
app.all("/mcp", async (req, res) => {
  try {
    const transport = new import_streamableHttp.StreamableHTTPServerTransport({
      sessionIdGenerator: void 0
    });
    const server = createMcpServer();
    res.on("close", () => {
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("[readnrate-blog-mcp] MCP handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal MCP server error" });
    }
  }
});
if (!process.env.VERCEL) {
  const port = parseInt(process.env.PORT ?? "3000", 10);
  app.listen(port, "0.0.0.0", () => {
    console.log(`[readnrate-blog-mcp] HTTP server listening on port ${port}`);
    console.log(`[readnrate-blog-mcp] MCP endpoint: http://localhost:${port}/mcp`);
  });
}
var http_server_default = app;
