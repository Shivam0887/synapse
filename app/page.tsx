import {
  CardBody,
  CardContainer,
  CardItem,
} from "@/components/globals/3d-card";
import { ContainerScroll } from "@/components/globals/container-scroll-animation";
import { LampContainer } from "@/components/globals/lamp";
import { PLANS } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative">
      <section className="z-0 relative min-h-full w-full bg-neutral-950 rounded-md flex flex-col items-center antialiased">
        <div className="absolute inset-0 h-full w-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)]" />

        <div className="flex flex-col">
          <ContainerScroll
            titleComponent={
              <div className="flex items-center flex-col gap-4">
                <Link
                  href="/dashboard"
                  className="font-medium p-8 text-xl md:text-2xl border-t-2 rounded-full border-[#4D4D4D] bg-[#1F1F1F] hover:bg-white group transition-all flex items-center justify-center gap-4 hover:shadow-xl hover:shadow-neutral-500 duration-500"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-500 to-neutral-600 font-sans group-hover:bg-gradient-to-r group-hover:from-neutral-950 group-hover:to-neutral-900">
                    Start For Free Today
                  </span>
                </Link>

                <h1 className="text-5xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600 font-sans font-bold">
                  Automate Your Work With Synapse
                </h1>
              </div>
            }
          >
            <Image
              src="/banner.png"
              alt="banner"
              fill
              quality={100}
              className="object-cover border-8 rounded-2xl"
            />
          </ContainerScroll>
        </div>
      </section>

      <section id="pricing">
        <LampContainer>
          <h1 className="text-5xl bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-600 font-sans font-bold">
            Plans That Fit You Best
          </h1>
        </LampContainer>

        <div className="flex items-center justify-center flex-col lg:flex-row gap-8 -mt-60 mb-6">
          <CardContainer className="inter-var ">
            <CardBody className="bg-gray-50 space-y-4 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-neutral-500/[0.1] dark:bg-black dark:border-[#E2CBFF] border-black/[0.1] w-full md:!w-[350px] h-auto rounded-xl p-6 border">
              <CardItem
                translateZ="50"
                className="text-xl space-y-2 font-bold text-neutral-600 dark:text-white "
              >
                <h2>Pro Plan</h2>
                <p className="text-3xl md:text-4xl lg:text-5xl">
                  $19/<sub>month</sub>
                </p>
              </CardItem>
              <CardItem
                translateZ="60"
                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
              >
                Get a glimpse of what our software is capable of. Just a heads
                up {"you'll"} never leave us after this!
                <ul className="my-4 flex flex-col gap-2">
                  {PLANS["Pro"].map(({ available, desc, icon: Icon }, i) => (
                    <li
                      key={`Pro:${i}`}
                      className={`flex items-center gap-2 ${
                        available ? "" : "text-neutral-500"
                      }`}
                    >
                      <Icon />
                      {desc}
                    </li>
                  ))}
                </ul>
              </CardItem>
              <Link
                href="/billing?plan=Pro"
                className="flex justify-between items-center mt-8"
              >
                <CardItem
                  translateZ={20}
                  className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white"
                >
                  Try now →
                </CardItem>
              </Link>
            </CardBody>
          </CardContainer>
          <CardContainer className="inter-var">
            <CardBody className="bg-gray-50 space-y-4 relative group/card dark:hover:shadow-2xl dark:hover:shadow-neutral-500/[0.1] dark:bg-black dark:border-[#E2CBFF] border-black/[0.1] w-full md:!w-[350px] h-auto rounded-xl p-6 border">
              <CardItem
                translateZ="50"
                className="text-xl space-y-2 font-bold text-neutral-600 dark:text-white "
              >
                <h2>Premium Plan</h2>
                <p className="text-3xl md:text-4xl lg:text-5xl">
                  $49/<sub>month</sub>
                </p>
              </CardItem>
              <CardItem
                translateZ="60"
                className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
              >
                Upgrade to the Premium Plan & unlock the full potential of
                automation with advanced features.
                <ul className="my-4 flex flex-col gap-2">
                  {PLANS["Premium"].map(
                    ({ available, desc, icon: Icon }, i) => (
                      <li
                        key={`Premium:${i}`}
                        className={`flex items-center gap-2 ${
                          available ? "" : "text-neutral-500"
                        }`}
                      >
                        <Icon />
                        {desc}
                      </li>
                    )
                  )}
                </ul>
              </CardItem>
              <Link
                href="/billing?plan=Premium"
                className="flex justify-between items-center mt-8"
              >
                <CardItem
                  translateZ={20}
                  as="button"
                  className="px-4 py-2 rounded-xl text-xs cursor-pointer font-normal dark:text-white"
                >
                  Try now →
                </CardItem>
              </Link>
            </CardBody>
          </CardContainer>
        </div>
      </section>
    </main>
  );
}
