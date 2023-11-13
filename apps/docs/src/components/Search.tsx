// @ts-nocheck
"use client";

import { createPortal } from "react-dom";
import { DocSearchModal, useDocSearchKeyboardEvents } from "@docsearch/react";
import { SearchIcon } from "@iconicicons/react";
import { Button, Kbd } from "@lmsqueezy/wedges";
import Link from "next/link";
import Router from "next/router";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const docSearchConfig = {
  appId: process.env.NEXT_PUBLIC_DOCSEARCH_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_DOCSEARCH_API_KEY,
  indexName: process.env.NEXT_PUBLIC_DOCSEARCH_INDEX_NAME,
};

function Hit({ hit, children }) {
  return (
    <Link
      className={cn({
        "DocSearch-Hit--Result": hit.__is_result?.(),
        "DocSearch-Hit--Parent": hit.__is_parent?.(),
        "DocSearch-Hit--FirstChild": hit.__is_first?.(),
        "DocSearch-Hit--LastChild": hit.__is_last?.(),
        "DocSearch-Hit--Child": hit.__is_child?.(),
      })}
      href={hit.url}
    >
      {children}
    </Link>
  );
}

export function Search() {
  let [isOpen, setIsOpen] = useState(false);
  let [modifierKey, setModifierKey] = useState("command");

  const suffixTitle = (title) => {
    if (!title) {
      return title;
    }

    let section = "Wedges Docs";

    return `${title} - ${section}`;
  };

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  useDocSearchKeyboardEvents({ isOpen, onOpen, onClose });

  useEffect(() => {
    setModifierKey(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? "command" : "ctrl");
  }, []);

  return (
    <>
      <Button
        asChild
        className="md:px-12px md:py-8px md:shadow-wg-xs duration-180 group flex aspect-square w-10 justify-center border-transparent p-0 shadow-none outline-white hover:border-transparent hover:bg-white/10 md:mr-2 md:aspect-auto md:w-auto md:min-w-[18rem] md:justify-between md:border-white/20 md:hover:border-white/40 md:hover:bg-transparent"
        variant="outline"
        onClick={onOpen}
      >
        <button>
          <span className="text-surface-500 md:group-hover:text-surface-500 duration-180 flex items-center gap-1.5 transition-colors group-hover:text-white">
            <SearchIcon aria-label="Quick search" />
            <span className="hidden md:block">Quick search&hellip;</span>
          </span>

          <Kbd
            className="text-surface-500 ml-2 hidden border-none md:inline-flex"
            keys={[modifierKey]}
          >
            K
          </Kbd>
        </button>
      </Button>

      {isOpen &&
        createPortal(
          <DocSearchModal
            {...docSearchConfig}
            hitComponent={Hit}
            initialScrollY={window.scrollY}
            navigator={{
              navigate({ itemUrl }) {
                Router.push(itemUrl);
              },
            }}
            transformItems={(items) => {
              return items.map((item, index) => {
                // We transform the absolute URL into a relative URL to
                // leverage Next's preloading.
                const a = document.createElement("a");

                a.href = item.url;

                const hash = a.hash === "#content-wrapper" || a.hash === "#header" ? "" : a.hash;

                if (item.hierarchy?.lvl0) {
                  item.hierarchy.lvl0 = item.hierarchy.lvl0.replace(/&amp;/g, "&");
                  item.hierarchy.lvl0 = item.hierarchy.lvl0.replace("Documentation ", "");
                }

                if (item._highlightResult?.hierarchy?.lvl0?.value) {
                  item._highlightResult.hierarchy.lvl0.value =
                    item._highlightResult.hierarchy.lvl0.value.replace(/&amp;/g, "&");

                  item._highlightResult.hierarchy.lvl0.value =
                    item._highlightResult.hierarchy.lvl0.value.replace("Documentation ", "");
                }

                if (item.content) {
                  item.content = suffixTitle(item.content, item);
                }

                if (item._snippetResult?.content?.value) {
                  item._snippetResult.content.value = suffixTitle(
                    item._snippetResult.content.value,
                    item
                  );
                }
                if (item._highlightResult?.content?.value) {
                  item._highlightResult.content.value = suffixTitle(
                    item._highlightResult.content.value,
                    item
                  );
                }
                if (
                  item._snippetResult?.hierarchy?.[item.type]?.value &&
                  item._snippetResult?.hierarchy?.[item.type]?.value !== null
                ) {
                  item._snippetResult.hierarchy[item.type].value = suffixTitle(
                    item._snippetResult?.hierarchy?.lvl2?.value,
                    item
                  );
                }
                if (item._highlightResult?.hierarchy_camel[0]?.[item.type]?.value) {
                  item._highlightResult.hierarchy_camel[0][item.type].value = suffixTitle(
                    item._highlightResult.hierarchy_camel[0][item.type].value,
                    item
                  );
                }

                item.hierarchy[item.type] = suffixTitle(item.hierarchy[item.type], item);

                return {
                  ...item,
                  url: `${a.pathname}${hash}`,
                  __is_result: () => true,
                  __is_parent: () => item.type === "lvl1" && items.length > 1 && index === 0,
                  __is_child: () =>
                    item.type !== "lvl1" &&
                    items.length > 1 &&
                    items[0].type === "lvl1" &&
                    index !== 0,
                  __is_first: () => index === 1,
                  __is_last: () => index === items.length - 1 && index !== 0,
                };
              });
            }}
            onClose={onClose}
          />,
          document.body
        )}
    </>
  );
}
