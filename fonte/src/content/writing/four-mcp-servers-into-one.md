---
title: 'Four MCP servers became one, and the reason was a bug that shipped three times'
description: 'We had one MCP server per product. They were copies of the same scaffold, so a single bad SQL guard shipped as three separate bugs. Here is what we replaced them with, and how we proved it before switching anything off.'
pubDate: 2026-08-19
tags: ['MCP', 'multi-tenant', 'architecture']
draft: true
---

> **Rascunho.** A estrutura e as evidências estão aqui; o texto final é seu.
> Enquanto `draft: true`, este arquivo não entra no build nem aparece no site.
> Quando estiver pronto, troque para `draft: false`.

We ran four MCP servers. One per product, plus the unified one that replaced
them. This is the story of why the fourth exists.

## The setup

Each product had its own MCP server so that agents could read the product's
data under the tenant's own permissions. Reasonable on day one: each product
has its own schema, its own roles, its own idea of what a user is allowed to
see.

<!-- O que contar aqui:
     - o modelo multi-tenant (schema por tenant no PostgreSQL)
     - por que o agente precisa do mesmo escopo de permissao da interface
     - quantas tools cada servidor expunha (~54) -->

## The problem was not the servers, it was that they were copies

Each new server started as a copy of the previous scaffold. Same connection
handling, same authorisation layer, same tools — around fifty of them,
duplicated verbatim.

Then a SQL guard rejected `OFFSET` by mistake.

It did not ship as one bug. It shipped as three, in three products, at the same
time, and each had to be found and fixed separately.

<!-- O ponto forte do texto esta aqui. Vale detalhar:
     - como o defeito se manifestou para o usuario
     - quanto tempo levou para perceber que era o mesmo bug
     - por que a duplicacao escondeu isso -->

## What replaced them

One server that resolves the connection per product and per instance at
runtime, instead of being compiled around a single product.

<!-- Descrever:
     - como a resolucao dinamica funciona
     - leitura por padrao, acoes administrativas so sob escopo elevado
     - como o escopo de tenant e preservado -->

## Proving it before switching anything off

The three original servers kept running. The unified one had to demonstrate,
product by product, that it covered the same cases before any of them was
retired.

<!-- Esta secao e o que separa o texto de um post de opiniao.
     Vale descrever o metodo de prova de cobertura. -->

## What I would tell someone starting this

<!-- Fechamento. Uma licao concreta, nao um resumo. -->
