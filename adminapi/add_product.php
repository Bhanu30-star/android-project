<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['pname']) && isset($_POST['pprice']) && isset($_POST['distributor_id']) && isset($_POST['purprice_inc']) && isset($_POST['palias']) && isset($_POST['pcgst']) && isset($_POST['psgst']) && isset($_POST['phsn']) && isset($_POST['p_disc_app']) && isset($_POST['pdiscount']) && isset($_POST['pdiscountamt']) && isset($_POST['decimal_allow']) && $_POST['measurement_value']!='')
{
	$ver = $_POST['distributor_id'];
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
	$pname=$_POST['pname'];
	$pprice=$_POST['pprice'];
	$pprice_exc=$_POST['pprice_exc'];
	$dealerprice=$_POST['dealerprice'];
	$purprice_inc=$_POST['purprice_inc'];
	$purprice_exc=$_POST['purprice_exc'];
	$palias=$_POST['palias'];
	$phsn=$_POST['phsn'];
	$pcgst=$_POST['pcgst'];
	$psgst=$_POST['psgst'];
	$mrp_price1=$_POST['mrp_price'];
	$catagory_id=$_POST['category_id'];
	$sabcat_id=$_POST['sabcategory_id'];
	$pigst=$pcgst+$psgst;
	$p_disc_app=$_POST['p_disc_app'];
	$decimal_allow=$_POST['decimal_allow'];
	$lowstock1=$_POST['lowstock'];
	$p_disc_per=$_POST['pdiscount'];
	$p_disc_amt=$_POST['pdiscountamt'];
	$p_m_unit=$_POST['measurement_value'];
	$p_m_unit_2=$_POST['secondary_unit'];
	if($p_m_unit_2=='')
		$p_m_unit_2=$p_m_unit;
	$prowarranty = isset($_POST['prowarranty']) ? $_POST['prowarranty'] : '';
	$pro_pstockhand = isset($_POST['pstockhand']) ? $_POST['pstockhand'] : '0';
	$billdate1 = isset($_POST['stock_effect_date']) ? $_POST['stock_effect_date'] : $scro;
	
	$tcs_tds_applicable=$_POST['tcs_tds_applicable'];
	$sale_gst_applicable = isset($_POST['sale_gst_applicable']) ? $_POST['sale_gst_applicable'] : 'Yes';
	$pitemtype1=$_POST['itemtype'];
	$pmaintain_inventory1=$_POST['maintain_inventory'];
	$pconsumerawproduct1=$_POST['consumerawproduct'];
	$toder = isset($_POST['total_order']) ? $_POST['total_order'] : '';
	$conversion_value=$_POST['conversion_value'];
	$unit_conversion = isset($_POST['unit_conversion']) ? $_POST['unit_conversion'] : '';
	$pro_type_val=$_POST['product_type'];
	$proserialval=$_POST['pro_serial_category'];
	if($proserialval=="Accessories")
		$datatype='Quantity';
	else if($proserialval=="Mobile")
		$datatype='IMEI';
	else if($proserialval=="" && $pro_type_val=="Serial No")
	{
		$proserialval='Mobile';
		$datatype='IMEI';
	}
	$cess_calculation = isset($_POST['cess_calculation']) ? $_POST['cess_calculation'] : 'Exclusive';
	$cess_disc_per = isset($_POST['cessdiscount']) ? $_POST['cessdiscount'] : '';
	$cess_disc_app = isset($_POST['cess_disc_app']) ? $_POST['cess_disc_app'] : '';
	$cess_per_amt = isset($_POST['cesspcamt']) ? $_POST['cesspcamt'] : '';	

	$cess_on_sale=$cess_on_pur='No';
	if($cess_disc_app=='Yes')
	{
		$cess_on_sale=$cess_on_pur='Yes';
	}


	
	$res_product_stock = mysqli_query($con,"SELECT product_name FROM  tbl_product where product_name='$pname' and distributor_id='$ver'");
	if(mysqli_num_rows($res_product_stock)<=0)
	{									
		$query=mysqli_query($con,"insert into tbl_product(distributor_id,product_name,product_price,stock_quantity, alias,hsn_code,parent_group, unit,CGST, SGST,tb_insertdatetime,discount_applicable,discount_percentage,discount_amount, purchase_price,decimal_category,cess_applicable, cess_percentage, cess_pc_amt,product_type,IGST,category_id,subcategory_id,low_stock_quantity,dealer_price, mrp_price,purchase_price_exc, item_type,maintain_inventory, consumable_raw_product,gst_applicable,`serial_type`,`data_type`,`product_price_exc`, `tcs_tds_applicable`, `create_source`,`secondary_unit`, `warranty`,`cess_calculation`,`cess_on_sale`,`cess_on_purchase`)values('$ver','$pname','$pprice','$pro_pstockhand','$palias','$phsn', 'General','$p_m_unit','$pcgst','$psgst','$cdate','$p_disc_app','$p_disc_per','$p_disc_amt','$purprice_inc','$decimal_allow','$cess_disc_app','$cess_disc_per','$cess_per_amt','$pro_type_val','$pigst','$catagory_id', '$sabcat_id','$lowstock1','$dealerprice_inc','$mrp_price1','$purprice_exc','$pitemtype1','$pmaintain_inventory1','$pconsumerawproduct1','$sale_gst_applicable','$proserialval','$datatype','$pprice_exc','$tcs_tds_applicable','Admin App','$p_m_unit_2','$prowarranty','$cess_calculation','$cess_on_sale','$cess_on_pur')");	
		$session_bundle_pro_id = mysqli_insert_id($con);
		
		if($pro_pstockhand>0)
		{
			$uniqueId=uniqid();
			$uniqueId1="PR".strtoupper($uniqueId);
			$query = mysqli_query($con,"insert into tbl_distributor_transaction(product_id,distributor_id,quantity,transaction_date,transaction_time, txn_type, bill_date, bill_time,unique_bill,purchase_category,payment_status,product_price)values('$session_bundle_pro_id','$ver','$pro_pstockhand','$scro','$scri','Add','$billdate1','$scri','$uniqueId1','Opening Stock','Complete','$purprice_inc')");
														
			$stock_insert = mysqli_query($con,"INSERT IGNORE INTO tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$ver','$session_bundle_pro_id','0','$pro_pstockhand','$billdate1','$scri')");
		}
		
		if($pconsumerawproduct1=="Yes")
		{
			$json_a=json_decode($toder, true);     
			foreach ($json_a as $person_a)
			{
				$pro_id=$person_a['product_id'];
				$pro_quan=$person_a['quantity'];
				$query = mysqli_query($con,"INSERT INTO `tbl_product_consumable`(`product_id`, `consume_product_id`, `quantity`, `status`, `insert_date`) VALUES ('$session_bundle_pro_id','$pro_id','$pro_quan','Active','$scro')");
			}
		}
		if($conversion_value=="Yes")
		{
			$json_a=json_decode($unit_conversion, true);     
			foreach ($json_a as $unit_data)
			{
				$p_qty_val=$unit_data['unit_rate'];
				$unit_1="1 ".$unit_data['unit_1'];
				$unit_2=$unit_data['unit_2'];
				$unit_primary=$unit_data['primary_value'];
				$sale_price=$unit_data['sale_price'];
				$conversion_check=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE product_id='$session_bundle_pro_id' and total_unit='$p_qty_val' and status='Active'");
				if(mysqli_num_rows($conversion_check)<=0)
				{
					$query_insert = mysqli_query($con,"INSERT INTO `tbl_product_conversion_unit`(`product_id`, `conversion_detail`, `total_unit`, `conversion_unit`, `primary_value`, `status`, sale_price) VALUES ('$session_bundle_pro_id','$unit_1','$p_qty_val','$unit_2','$unit_primary','Active','$sale_price')");	
				}
			}
		}
		$response['success']='1';
		$response['message']="Insert Successful";			
	}
	else
	{
		$response['success']='1';
		$response['message']="Product already exists";
	}
}
else
{
	$response['success']='0';
	$response['message']="Required field missing";
}	
echo json_encode($response);
?>