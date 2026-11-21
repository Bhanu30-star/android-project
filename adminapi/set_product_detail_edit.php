<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['distributor_id']))
{
	$ver = $_POST['distributor_id'];
	$proname=mysqli_real_escape_string($con,$_POST['pname']);
	$pid=$_POST['pid'];
	$pprice_inc=$_POST['pprice_inc'];
	$pprice_exc=$_POST['pprice_exc'];
	$dealerprice_inc=$_POST['dealerprice_inc'];
	$purprice_inc=$_POST['purprice_inc'];
	$purprice_exc=$_POST['purprice_exc'];
	$palias=$_POST['palias'];
	$phsn=$_POST['phsn'];
	$mrp_price1=$_POST['mrp_price'];
	$gst_applicable=$_POST['gst_applicable'];
	$pcgst=$_POST['pcgst'];
	$psgst=$_POST['psgst'];
	$pigst=$_POST['pigst'];	
	$p_disc_app=$_POST['discount_applicable'];
	$p_disc_per=$_POST['pdiscount'];
	$p_disc_amt=$_POST['pdiscountamt_inc'];
	$decimal_allow=$_POST['decimal_allow'];
	$punit1=$_POST['measureunit'];
	$p_m_unit_2=$_POST['secondary_unit'];
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('H:i:sa');
	
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_product where product_id='$pid'");
	while($fetch_product11=mysqli_fetch_assoc($res_product_stock1)) 
	{
		$pname1=$fetch_product11['product_name'];
		$pprice1=$fetch_product11['product_price'];
		$pp_price_exc=$fetch_product11['product_price_exc'];
		$purprice1=$fetch_product11['purchase_price'];
		$dlprice1=$fetch_product11['dealer_price'];
		$purprice_exc1=$fetch_product11['purchase_price_exc'];
		$palias1=$fetch_product11['alias'];
		$phsnc1=$fetch_product11['hsn_code'];
		$pgst_applicable=$fetch_product11['gst_applicable'];
		$procgst1=$fetch_product11['CGST'];
		$prosgst1=$fetch_product11['SGST'];
		$proigst1=$fetch_product11['IGST'];
		$pro_disc_app1=$fetch_product11['discount_applicable'];
		$pro_disc_per1=$fetch_product11['discount_percentage'];
		$pro_disc_amt1=$fetch_product11['discount_amount'];
		$pro_status=$fetch_product11['status'];
		$product_type_val1=$fetch_product11['product_type'];
		$unit1=$fetch_product11['unit'];
		
		$query = mysqli_query($con,"INSERT IGNORE INTO `tbl_product_history`(`product_id`, `distributor_id`, `product_name`, `old_product_price`, `new_product_price`, `old_purchase_price`, `new_purchase_price`, `discount_applicable`, `discount_percentage`, `discount_amount`,`alias`, `hsn_code`, `parent_group`, `unit`, `gst_applicable`, `CGST`, `SGST`, `status`,`tb_insertdatetime`,`product_type`,`IGST`,`old_dealer_price`,`new_dealer_price`,purchase_price_exc,product_price_exc) VALUES ('$pid','$ver','$pname1','$pprice1','$pprice_inc','$purprice1','$purprice_inc','$pro_disc_app1','$pro_disc_per1','$pro_disc_amt1','$palias1','$phsnc1','General','$unit1', '$pgst_applicable', '$procgst1','$prosgst1','$pro_status','$cdate','$product_type_val1','$proigst1','$dlprice1','$dealerprice_inc','$purprice_exc1','$pp_price_exc')");
	}
	
	$uq1=mysqli_query($con,"UPDATE tbl_product SET product_name='$proname', product_price='$pprice_inc',tb_updatedatetime='$cdate',alias='$palias',hsn_code='$phsn', gst_applicable = '$gst_applicable', CGST='$pcgst',SGST='$psgst',discount_applicable='$p_disc_app',discount_percentage='$p_disc_per',discount_amount='$p_disc_amt',purchase_price='$purprice_inc',IGST='$pigst',mrp_price='$mrp_price1',dealer_price='$dealerprice_inc',purchase_price_exc='$purprice_exc',unit='$punit1',product_price_exc='$pprice_exc',create_source='Admin App',decimal_category='$decimal_allow' where product_id='$pid'");
	
	if($p_m_unit_2!='')
		$uq_unit=mysqli_query($con,"UPDATE tbl_product SET secondary_unit='$p_m_unit_2' where product_id='$pid'");
		
	$response['success']='1';
	$response['details']="Product Detail Successfully Updated";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>