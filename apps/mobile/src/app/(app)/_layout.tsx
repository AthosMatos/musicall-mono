import BottomTabs from "@/components/layout/bottom-tabs";
import Header from "@/components/layout/header";
import { DefaultStack } from "@/components/utility/defaultStack";


function Layout() {
  return <>
    <Header />
    <DefaultStack />
    <BottomTabs />
  </>

}

export default Layout;
