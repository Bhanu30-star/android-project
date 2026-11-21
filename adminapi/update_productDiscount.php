<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['pid']) && isset($_POST['pdiscount']) && isset($_POST['distributor_id']) && isset($_POST['pdiscountamt']) && isset($_POST['p_disc_app']))
{
	$ver = $_POST['distributor_id'];
	$pid=$_POST['pid'];
	$p_disc_app=$_POST['p_disc_app'];
	$p_disc_per=$_POST['pdiscount'];
	$p_disc_amt=$_POST['pdiscountamt'];
	$low_stock_quan=$_POST['low_stock_quantity'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate  = date("Y-m-d")." ".date('h:i:sa');
	$scro=date("Y-m-d");
	$scri=date('h:i:sa');
											
	$res_product_stock1 = mysqli_query($con,"SELECT * FROM  tbl_product where product_id='$pid'");
	while($fetch_product11=mysqli_fetch_assoc($res_product_stock1))
	{
		$pname1=$fetch_product11['product_name'];
		$pprice1=$fetch_product11['product_price'];
		$purprice1=$fetch_product11['purchase_price'];
		$pstock=$fetch_product11['stock_quantity'];
		$palias1=$fetch_product11['alias'];
		$phsnc1=$fetch_product11['hsn_code'];
		$procgst1=$fetch_product11['CGST'];
		$prosgst1=$fetch_product11['SGST'];
		$pro_disc_app1=$fetch_product11['discount_applicable'];
		$pro_disc_per1=$fetch_product11['discount_percentage'];
		$pro_disc_amt1=$fetch_product11['discount_amount'];
		$pro_status=$fetch_product11['status'];
		$pro_stock_quantity=$fetch_product11['low_stock_quantity'];				
		$query = mysqli_query($con,"INSERT INTO `tbl_product_history`(`product_id`, `distributor_id`, `product_name`, `old_product_price`, `new_product_price`, `old_purchase_price`, `new_purchase_price`, `purchase_price_end_date`, `discount_applicable`, `discount_percentage`, `discount_amount`, `stock_quantity`, `alias`, `hsn_code`, `parent_group`, `unit`, `CGST`, `SGST`, `status`, `tb_insertdatetime`,`low_stock_quantity`) VALUES ('$pid','$ver','$pname1','$pprice1','$pprice','$purprice1','$purprice','$scro','$p_disc_app','$p_disc_per','$p_disc_amt','$pstock','$palias','$phsn','General','Pcs.','$procgst1','$prosgst1','$pro_status','$cdate','$pro_stock_quantity')");								
	}
											
	$uq1=mysqli_query($con,"UPDATE tbl_product SET tb_updatedatetime='$cdate',discount_applicable='$p_disc_app',discount_percentage='$p_disc_per',discount_amount='$p_disc_amt',low_stock_quantity='$low_stock_quan' where product_id='$pid'");
	if($uq1)
	{
		$response['success']='1';
		$response['message']="Update Detail Successful";
	}
	else
	{
		$response['success']='1';
		$response['message']="Not Update";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>