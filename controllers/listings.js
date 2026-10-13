const Listing = require("../models/listing");
const geocode = require("../utils/geocode");

// Show all listings
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// Render new listing form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// Show a single listing
module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        });

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Purono listing e coordinates na thakle ekbar ber kore save kore rakhbe
    if (!listing.geometry || listing.geometry.lat == null) {
        const geo = await geocode(listing.location, listing.country);
        if (geo) {
            await Listing.updateOne({ _id: listing._id }, { geometry: geo });
            listing.geometry = geo;
        }
    }

    res.render("listings/show.ejs", { listing });
};

// Create new listing
module.exports.createListing = async (req, res) => {
    if (!req.file) {
        req.flash("error", "Please upload an image!");
        return res.redirect("/listings/new");
    }

    const { path: url, filename } = req.file;

    const listingData = { ...req.body.listing };

    const newListing = new Listing(listingData);

    // Save uploaded Cloudinary image details
    newListing.image = {
        url: url,
        filename: filename
    };

    newListing.owner = req.user._id;

    const geo = await geocode(newListing.location, newListing.country);
    if (geo) newListing.geometry = geo;

    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// Render edit form
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
};

// Update listing
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    const listingData = { ...req.body.listing };

    const existingListing = await Listing.findById(id);

    if (!existingListing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Update image if a new file is uploaded
    if (req.file) {
        existingListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    } else if (
        listingData.image &&
        typeof listingData.image === "string" &&
        listingData.image.trim() !== ""
    ) {
        // Update image URL if using a URL input in edit form
        existingListing.image.url = listingData.image;
    }

    delete listingData.image;

    Object.assign(existingListing, listingData);

    // Location/country change hole map position o update hobe
    const geo = await geocode(existingListing.location, existingListing.country);
    if (geo) existingListing.geometry = geo;

    await existingListing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// Delete listing
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};