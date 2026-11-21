<?php
include("../../../connect.php"); 
$response = array();
if(isset($_POST['distributor_user_id']) && isset($_POST['distributor_id']))
{
	$dis_uid = $_POST['distributor_user_id'];
	$dis_id = $_POST['distributor_id'];
	
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country,serialno_configuration FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		$response['serialno_configuration']=$disRow['serialno_configuration'];
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$select_user=mysqli_query($con,"SELECT imei_no,session_id FROM tbl_distributor_users where status='Active' and distributor_user_id='$dis_uid'");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$response['user_imei']=$fetch_user['imei_no'];
		}
	}
	else
	{
		$response['user_imei']='';
	}
	$da = date("Y-m-d");
	
	$product=array();
	$select_product = mysqli_query($con,"select * from tbl_product,tbl_product_category_master,tbl_product_subcategory_master where tbl_product.category_id=tbl_product_category_master.category_id and tbl_product.subcategory_id=tbl_product_subcategory_master.subcategory_id and tbl_product.status='Active' and tbl_product.distributor_id='$dis_id' order by tbl_product.product_id ASC");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$temp_pro_id = $fetch_product['product_id'];
			$product['product_id']=$fetch_product['product_id'];
			$product['product_name']=$fetch_product['product_name'];
			$product['product_price']=$fetch_product['product_price'];
			$product['product_price_exc']=$fetch_product['product_price_exc'];
			$product['purchase_price']=$fetch_product['purchase_price'];
			$product['purchase_price_exc']=$fetch_product['purchase_price_exc'];
			$product['dealer_price']=$fetch_product['dealer_price'];
			$product['hsn_code']=$fetch_product['hsn_code'];
			$product['mrp']=$fetch_product['mrp_price'];
			$product['unit']=$fetch_product['unit'];
			$product['secondary_unit']=$fetch_product['secondary_unit'];
			$product['alias']=$fetch_product['alias'];
			$product['tcs_tds_applicable']=$fetch_product['tcs_tds_applicable'];
			$product['decimal_category']=$fetch_product['decimal_category'];
			$product['product_type']=$fetch_product['product_type'];
			$product['discount']=$fetch_product['discount_applicable'];
			$product['disc_percentage_amt']=$fetch_product['discount_percentage'];
			$product['disc_percentage']=$fetch_product['discount_amount'];
			$product['CGST']=$fetch_product['CGST'];
			$product['SGST']=$fetch_product['SGST'];
			$product['IGST']=$fetch_product['IGST'];
			$product['cess_app']=$fetch_product['cess_applicable'];
			$product['cess_percentage']=$fetch_product['cess_percentage'];
			$product['cess_amt']=$fetch_product['cess_pc_amt'];
			$product['product_category']=$fetch_product['product_category'];
			$product['free_stock']=$fetch_product['free_stock'];
			
			$res_stock1 = mysqli_query($con, "SELECT * FROM  tbl_distributor_stock where date <='$da' and distributor_id='$dis_id' and product_id='$temp_pro_id' ORDER BY `date` DESC LIMIT 1");
			if (mysqli_num_rows($res_stock1)>0 && $fetch_product['maintain_inventory']=='Yes') {
				$row_stock1 =  mysqli_fetch_assoc($res_stock1);
				$product['stock_quantity']= $row_stock1['closing_stock'];
			}
			else
			{
				$product['stock_quantity']=0;
			}
			
			
			
			$product['low_stock_quantity']=$fetch_product['low_stock_quantity'];
			$product['item_type']=$fetch_product['item_type'];
			$product['maintain_inventory']=$fetch_product['maintain_inventory'];
			$product['consumable_raw_product']=$fetch_product['consumable_raw_product'];
			$product['serial_type']=$fetch_product['serial_type'];
			$product['data_type']=$fetch_product['data_type'];
			$consume_detail=array();
			$product['consume_detail']=array();
			$proidval=$fetch_product['product_id'];
			$res_consumedetail=mysqli_query($con,"SELECT * FROM tbl_product_consumable,tbl_product WHERE tbl_product_consumable.consume_product_id = tbl_product.product_id and tbl_product_consumable.product_id='$proidval' and tbl_product_consumable.status='Active'");
			if(mysqli_num_rows($res_consumedetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_consumedetail))
				{
					$consume_detail['consume_product_id']=$fetch_consume['consume_product_id'];
					$consume_detail['product_name']= $fetch_consume['product_name'];
					$consume_detail['quantity']= $fetch_consume['quantity'];
					$consume_detail['stock_quantity']=$fetch_consume['stock_quantity'];
					$product['consume_detail'][]=$consume_detail;
				}
			}
			else
			{
				$product['consume_detail']=$consume_detail;
			}
			
			$product['conversion_detail']=array();
			$conversion_detail=array();
			$res_conversiondetail=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE product_id='$proidval' and status='Active'");
			if(mysqli_num_rows($res_conversiondetail)>0)
			{
				while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
				{
					$conversion_detail['detail_id']=$fetch_consume['detail_id'];
					$conversion_detail['conversion_detail']= $fetch_consume['conversion_detail'];
					$conversion_detail['total_unit']= $fetch_consume['total_unit'];
					$conversion_detail['conversion_unit']=$fetch_consume['conversion_unit'];
					$conversion_detail['primary_value']=$fetch_consume['primary_value'];
					$conversion_detail['sale_price']=$fetch_consume['sale_price'];
					$product['conversion_detail'][]=$conversion_detail;
				}
			}
			else
			{
				$product['conversion_detail']=$conversion_detail;
			}
			
			
			$product['category_id']=$fetch_product['category_id'];
			$product['category_name']=$fetch_product['category_name'];
			$product['subcategory_id']=$fetch_product['subcategory_id'];
			$product['subcategory_name']=$fetch_product['subcategory_name'];



			$product['batch_detail']=array();
			$batch_detail=array();
			$res_batchdetail = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction WHERE distributor_id='$dis_id' AND product_id='$proidval' AND batch_no!='' AND txn_type='Add'");
			if(mysqli_num_rows($res_batchdetail)>0)
			{
				while($fetch_batch=mysqli_fetch_assoc($res_batchdetail))
				{
					$actual_qtyval=$fetch_batch['quantity']-$fetch_batch['batch_qty_adjust'];
					if($actual_qtyval>0)
					{
						$batch_detail['transaction_id']=$fetch_batch['transaction_id'];
						$batch_detail['batch_no']=$fetch_batch['batch_no'];
						$batch_detail['expiry_date']=$fetch_batch['expiry_date'];
						$batch_detail['packing']=$fetch_batch['packing'];
						$batch_detail['stock_qty']=$actual_qtyval;
						$product['batch_detail'][]=$batch_detail;
					}
				}
			}
			$response['product'][]=$product;
		}
	}
	else
	{
		$response['product']=$product;
	}
	
	
	$response['tcs_tds_percentage']=0;
	$select_tcstds = mysqli_query($con,"select * from tbl_bthawk_tcs_tds_details");
	if(mysqli_num_rows($select_tcstds)>0)
	{
		$fetch_tcstds=mysqli_fetch_array($select_tcstds);
		$response['tcs_tds_percentage']=$fetch_tcstds['value'];
	}

	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Feild Missing!!";
}	
echo json_encode($response);
?>