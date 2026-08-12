import { useEffect, useState } from "react";
import {
	Combobox,
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import clsx from "clsx"

export default function Select({ options, value, placeholder, onChange }) {
	const [localOptions, setLocalOptions] = useState([]);

	useEffect(() => {
		setLocalOptions(options);
	}, [options]);

	return (
		<Combobox
			as="div"
			value={options.find((option) => option.value === value)}
			onChange={(value) => onChange(value)}
		>
			<div className="relative">
				<ComboboxInput
					placeholder={placeholder}
					className={clsx(
						'block w-full rounded-xl py-4 px-5 bg-secondary outline outline-[1px] outline-zinc-400 text-white font-light placeholder:text-white/70 focus:ring-[1px] focus:ring-zinc-400',
						'focus:outline-none data-[focus]:outline-1 data-[focus]:-outline-offset-2'
					)}
					displayValue={(option) => option?.label}
					onChange={(e) => {
						setLocalOptions(
							options.filter((option) => option.label.includes(e.target.value))
						);
					}}
				/>
				<ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
					<ChevronUpDownIcon className="size-5 fill-white/60 group-data-[hover]:fill-white" />
				</ComboboxButton>

				{localOptions.length > 0 && (
					<ComboboxOptions
						anchor="bottom"
						transition
						className={clsx(
							'w-[var(--input-width)] mt-2 rounded-xl bg-secondary p-2 empty:invisible outline outline-[1px] outline-zinc-400 absolute z-10 max-h-60 overflow-auto text-base shadow-lg ring-opacity-5 focus:outline-none sm:text-sm',
							'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0'
						)}
					>
						{localOptions.map((option) => (
							<ComboboxOption key={option.value} value={option} className="group flex cursor-default items-center gap-2 rounded-xl py-3 px-3 select-none data-[focus]:bg-white/10">								
								<CheckIcon className="invisible size-5 fill-white group-data-[selected]:visible" />
								<div className="text-sm/6 text-white">{option.label}</div>
							</ComboboxOption>
						))}
					</ComboboxOptions>
				)}
			</div>
		</Combobox>
	);
}
