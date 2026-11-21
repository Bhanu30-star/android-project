<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['party_id']) && isset($_POST['distributor_id']))
{
	$pp_id1 = $_POST['party_id'];
	$ver = $_POST['distributor_id'];
	$product=array();
	$res = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_type in ('Service','FMCG','Serial No')");
	if(mysqli_num_rows($res)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($res))
		{
			extract($fetch_product);
			$pro_val_id=$product_id;
			$res_retailer_stock = mysqli_query($con,"SELECT tbl_party_transaction_detail.product_id, tbl_party_transaction_detail.quantity,tbl_party_transaction_detail.sale_unit FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to='$pp_id1' and tbl_party_transaction_detail.product_id='$pro_val_id'");
			if(mysqli_num_rows($res_retailer_stock)>0)
			{
				$total_sale_qty=0;
				while($fetch_retailer_stock=mysqli_fetch_assoc($res_retailer_stock))
				{
					$total_sale_qty=$total_sale_qty+$fetch_retailer_stock['quantity'];
					$product['sale_unit']=$fetch_retailer_stock['sale_unit'];
				}
				$retailer_stock_return = mysqli_query($con,"SELECT quantity FROM tbl_party_credit_note where distributor_id='$ver' and party_id='$pp_id1' and product_id='$pro_val_id'");
				$total_sale_return_qty=0;
				while($fetch_retailer_stock_return=mysqli_fetch_assoc($retailer_stock_return))
				{
					$total_sale_return_qty=$total_sale_return_qty+$fetch_retailer_stock_return['quantity'];
				}
				$product['product_id']=$product_id;
				$product['product_name']=$product_name;
				$product['product_price']=$product_price;
				$product['product_price_exc']=$product_price_exc;
				$product['primary_unit']=$fetch_product['unit'];
				$product['secondary_unit']=$fetch_product['secondary_unit'];
				$product['maintain_inventory']=$fetch_product['maintain_inventory'];
				$product['CGST']=$CGST;
				$product['SGST']=$SGST;
				$product['IGST']=$IGST;
				$product['tcs_tds_applicable']=$fetch_product['tcs_tds_applicable'];
				$product['cess_applicable']=$fetch_product['cess_applicable'];
				$product['cess_percentage']=$fetch_product['cess_percentage'];
				$product['decimal_category']=$decimal_category;
				$product['total_sale_qty']=$total_sale_qty-$total_sale_return_qty;
				
				
				$product['product_type']=$product_type;
				$product['serial_type']=$serial_type;
				$product['data_type']=$data_type;
				$conversion_detail=array();
				$res_conversiondetail=mysqli_query($con,"SELECT * FROM tbl_product_conversion_unit WHERE product_id='$pro_val_id' and status='Active'");
				if(mysqli_num_rows($res_conversiondetail)>0)
				{
					while($fetch_consume=mysqli_fetch_assoc($res_conversiondetail))
					{
						$conversion_detail['detail_id']=$fetch_consume['detail_id'];
						$conversion_detail['conversion_detail']= $fetch_consume['conversion_detail'];
						$conversion_detail['total_unit']= $fetch_consume['total_unit'];
						$conversion_detail['conversion_unit']=$fetch_consume['conversion_unit'];
						$conversion_detail['primary_value']=$fetch_consume['primary_value'];
						$product['conversion_detail'][]=$conversion_detail;
					}
				}
				else
				{
					$product['conversion_detail']=$conversion_detail;
				}
				
				$product_detail=array();
				$res_retailer_stock11 = mysqli_query($con,"SELECT tbl_party_transaction_detail.IMEI_NO FROM tbl_party_transaction,tbl_party_transaction_detail where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to='$pp_id1' and tbl_party_transaction_detail.product_id='$pro_val_id' and tbl_party_transaction_detail.IMEI_NO!=''");
				if(mysqli_num_rows($res_retailer_stock11)>0)
				{
					while($fetch_retailer_stock1=mysqli_fetch_assoc($res_retailer_stock11))
					{
						$sale_imei_no=$fetch_retailer_stock1['IMEI_NO'];
						$retailer_stock_return11 = mysqli_query($con,"SELECT tbl_party_credit_note.quantity FROM tbl_party_credit_note,tbl_party_credit_note_deatil where tbl_party_credit_note.unique_bill=tbl_party_credit_note_deatil.unique_bill and tbl_party_credit_note_deatil.product_id='$pro_val_id' and tbl_party_credit_note_deatil.IMEI='$sale_imei_no' and tbl_party_credit_note.distributor_id='$ver' and tbl_party_credit_note.party_id='$pp_id1'");
						if(mysqli_num_rows($retailer_stock_return11)<=0)
						{
							$product_detail['IMEI_NO']=$sale_imei_no;
							$product['product_detail'][]=$product_detail;
						}
					}
				}
				else
				{
					$product['product_detail']=$product_detail;
				}
				
				$response['product'][]=$product;
			}
		}
		$response['success']='1';
		$response['details']="Fetch Detail Successful";
	}
	else
	{
		$response['success']='0';
		$response['details']="No Data Available";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);

?>