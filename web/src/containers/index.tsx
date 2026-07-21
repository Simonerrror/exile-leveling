import { ErrorFallback } from "../components/ErrorFallback";
import { Loading } from "../components/Loading";
import { Navbar } from "../components/Navbar";
import { useI18n } from "../i18n";
import { pipe } from "../utility";
import { withBlank } from "../utility/withBlank";
import { withScrollRestoration } from "../utility/withScrollRestoration";
import { Suspense, lazy, useEffect, type JSX } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RoutesContainer = pipe(
  withBlank,
  withScrollRestoration,
)(lazy(() => import("./Routes")));
const BuildContainer = withBlank(lazy(() => import("./Build")));
const EditRouteContainer = withBlank(lazy(() => import("./EditRoute")));
const UsefulContainer = withBlank(lazy(() => import("./Useful")));
const RegexCatalog = withBlank(lazy(() => import("./RegexCatalog")));

export function App() {
  const { locale, t } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <Navbar />
      <Suspense fallback={<Loading />}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Routes>
            <Route
              path="/"
              element={
                <Page
                  title={t("app.usefulTitle")}
                  component={<UsefulContainer />}
                />
              }
            />
            <Route
              path="/leveling"
              element={
                <Page title={t("app.title")} component={<RoutesContainer />} />
              }
            />
            <Route
              path="/build"
              element={
                <Page
                  title={t("app.buildTitle")}
                  component={<BuildContainer />}
                />
              }
            />
            <Route
              path="/edit-route"
              element={
                <Page
                  title={t("app.editRouteTitle")}
                  component={<EditRouteContainer />}
                />
              }
            />
            <Route
              path="/useful"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/regex"
              element={
                <Page
                  title={t("app.regexTitle")}
                  component={<RegexCatalog />}
                />
              }
            />
          </Routes>
        </ErrorBoundary>
      </Suspense>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        closeOnClick={true}
        theme={"dark"}
        pauseOnFocusLoss={false}
        pauseOnHover={false}
      />
    </>
  );
}

interface PageProps {
  title: string;
  component: JSX.Element;
}

function Page({ title, component }: PageProps) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return component;
}
